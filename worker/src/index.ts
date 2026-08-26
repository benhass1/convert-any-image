export interface Env {
  ALLOWED_ORIGIN: string;
  CACHE_TTL_SECONDS: string;
}

type TranscriptCue = { text: string; startMs: number; durationMs: number };
type TranscriptPayload = { videoId: string; language: string; cached: boolean; cues: TranscriptCue[] };
const jsonHeaders = { "Content-Type": "application/json; charset=UTF-8" };

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== env.ALLOWED_ORIGIN) return null;
  return { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
function response(body: unknown, status: number, cors: HeadersInit) { return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...cors } }); }
function cacheKey(request: Request, videoId: string, language: string) { const url = new URL(request.url); url.pathname = `/__cache/transcript/${videoId}/${language}`; url.search = ""; return new Request(url.toString()); }
function parseYouTubeEvents(payload: { events?: Array<{ segs?: Array<{ utf8?: string }>; tStartMs?: number; dDurationMs?: number }> }): TranscriptCue[] { return (payload.events || []).flatMap((event) => { const text = (event.segs || []).map((segment) => segment.utf8 || "").join("").trim(); return text ? [{ text, startMs: event.tStartMs || 0, durationMs: event.dDurationMs || 0 }] : []; }); }
async function fetchTranscript(videoId: string, language: string): Promise<TranscriptCue[]> { const upstream = new URL("https://www.youtube.com/api/timedtext"); upstream.searchParams.set("v", videoId); upstream.searchParams.set("lang", language); upstream.searchParams.set("fmt", "json3"); const upstreamResponse = await fetch(upstream, { headers: { Accept: "application/json" } }); if (upstreamResponse.status === 429) throw new Error("UPSTREAM_RATE_LIMIT"); if (!upstreamResponse.ok) throw new Error("TRANSCRIPT_NOT_AVAILABLE"); return parseYouTubeEvents(await upstreamResponse.json()); }

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (!cors) return response({ error: "Origin is not allowed." }, 403, {});
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/v1/transcript") return response({ error: "Not found." }, 404, cors);
    let body: { videoId?: string; language?: string };
    try { body = await request.json(); } catch { return response({ error: "JSON body required." }, 400, cors); }
    const videoId = body.videoId?.trim() || "";
    const language = (body.language?.trim() || "en").toLowerCase();
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return response({ error: "A valid 11-character YouTube video ID is required." }, 400, cors);
    if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/.test(language)) return response({ error: "Language must be an IETF-style short code." }, 400, cors);
    const key = cacheKey(request, videoId, language);
    const cache = caches.default;
    const cached = await cache.match(key);
    if (cached) { const payload = await cached.json<TranscriptPayload>(); return response({ ...payload, cached: true }, 200, cors); }
    try {
      const cues = await fetchTranscript(videoId, language);
      const payload: TranscriptPayload = { videoId, language, cached: false, cues };
      const ttl = Math.max(60, Number.parseInt(env.CACHE_TTL_SECONDS || "86400", 10) || 86400);
      const cacheResponse = new Response(JSON.stringify(payload), { headers: { ...jsonHeaders, "Cache-Control": `public, max-age=${ttl}` } });
      context.waitUntil(cache.put(key, cacheResponse));
      return response(payload, 200, cors);
    } catch (error) {
      const message = error instanceof Error ? error.message : "TRANSCRIPT_NOT_AVAILABLE";
      return response({ error: message === "UPSTREAM_RATE_LIMIT" ? "Transcript source is temporarily rate limited." : "Transcript is unavailable for this video and language." }, message === "UPSTREAM_RATE_LIMIT" ? 429 : 404, cors);
    }
  },
};
