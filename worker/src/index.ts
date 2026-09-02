export interface Env {
  ALLOWED_ORIGINS: string;
  CACHE_TTL_SECONDS: string;
  AI: Ai;
}

type TranscriptCue = { text: string; startMs: number; durationMs: number };
type TranscriptPayload = { videoId: string; language: string; cached: boolean; cues: TranscriptCue[] };
type ClassificationTag = { label: string; score: number };
type EdgeAnalysisPayload = {
  success: true;
  model: string;
  analysis_type: "image_classification";
  verdict: "Classification signal only — not an AI-authenticity verdict";
  ai_probability: null;
  confidence_percent: number;
  confidence_label: "Low" | "Medium" | "High";
  raw_tags: ClassificationTag[];
};
const jsonHeaders = { "Content-Type": "application/json; charset=UTF-8" };
const MAX_ANALYSIS_BYTES = 8 * 1024 * 1024;
const IMAGE_ANALYSIS_MODEL = "@cf/microsoft/resnet-50";

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && !allowedOrigins.includes(origin)) return null;
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
function response(body: unknown, status: number, cors: HeadersInit) { return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...cors } }); }
function cacheKey(request: Request, videoId: string, language: string) { const url = new URL(request.url); url.pathname = `/__cache/transcript/${videoId}/${language}`; url.search = ""; return new Request(url.toString()); }
function parseYouTubeEvents(payload: { events?: Array<{ segs?: Array<{ utf8?: string }>; tStartMs?: number; dDurationMs?: number }> }): TranscriptCue[] { return (payload.events || []).flatMap((event) => { const text = (event.segs || []).map((segment) => segment.utf8 || "").join("").trim(); return text ? [{ text, startMs: event.tStartMs || 0, durationMs: event.dDurationMs || 0 }] : []; }); }
async function fetchTranscript(videoId: string, language: string): Promise<TranscriptCue[]> { const upstream = new URL("https://www.youtube.com/api/timedtext"); upstream.searchParams.set("v", videoId); upstream.searchParams.set("lang", language); upstream.searchParams.set("fmt", "json3"); const upstreamResponse = await fetch(upstream, { headers: { Accept: "application/json" } }); if (upstreamResponse.status === 429) throw new Error("UPSTREAM_RATE_LIMIT"); if (!upstreamResponse.ok) throw new Error("TRANSCRIPT_NOT_AVAILABLE"); return parseYouTubeEvents(await upstreamResponse.json()); }

function confidenceLabel(percent: number): EdgeAnalysisPayload["confidence_label"] {
  return percent >= 80 ? "High" : percent >= 50 ? "Medium" : "Low";
}

function normalizeClassification(result: unknown): ClassificationTag[] {
  const values = Array.isArray(result) ? result : result && typeof result === "object" && "result" in result ? (result as { result?: unknown }).result : [];
  if (!Array.isArray(values)) return [];
  return values
    .flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const record = value as { label?: unknown; score?: unknown };
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const score = typeof record.score === "number" && Number.isFinite(record.score) ? Math.max(0, Math.min(1, record.score)) : 0;
      return label ? [{ label, score }] : [];
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((tag) => ({ label: tag.label, score: Number(tag.score.toFixed(4)) }));
}

async function readImageBytes(request: Request): Promise<Uint8Array> {
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_ANALYSIS_BYTES) throw new Error("IMAGE_TOO_LARGE");
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("image") || form.get("file");
    if (!(file instanceof File)) throw new Error("IMAGE_REQUIRED");
    if (file.size > MAX_ANALYSIS_BYTES) throw new Error("IMAGE_TOO_LARGE");
    return new Uint8Array(await file.arrayBuffer());
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_ANALYSIS_BYTES) throw new Error("IMAGE_TOO_LARGE");
  return bytes;
}

async function detectImage(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    if (!env.AI) return response({ success: false, error: "Workers AI is not configured for this Worker." }, 503, cors);
    const bytes = await readImageBytes(request);
    if (!bytes.length) return response({ success: false, error: "An image body is required." }, 400, cors);
    const modelResult = await env.AI.run(IMAGE_ANALYSIS_MODEL, { image: [...bytes] });
    const rawTags = normalizeClassification(modelResult);
    const confidencePercent = Math.round((rawTags[0]?.score || 0) * 1000) / 10;
    const payload: EdgeAnalysisPayload = {
      success: true,
      model: IMAGE_ANALYSIS_MODEL,
      analysis_type: "image_classification",
      verdict: "Classification signal only — not an AI-authenticity verdict",
      ai_probability: null,
      confidence_percent: confidencePercent,
      confidence_label: confidenceLabel(confidencePercent),
      raw_tags: rawTags,
    };
    return response(payload, 200, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMAGE_ANALYSIS_FAILED";
    const status = message === "IMAGE_TOO_LARGE" ? 413 : message === "IMAGE_REQUIRED" ? 400 : 502;
    const publicMessage = message === "IMAGE_TOO_LARGE" ? "Images must be 8 MB or smaller for edge analysis." : message === "IMAGE_REQUIRED" ? "An image body is required." : "Edge image analysis is temporarily unavailable.";
    return response({ success: false, error: publicMessage }, status, cors);
  }
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (!cors) return response({ error: "Origin is not allowed." }, 403, {});
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const pathname = new URL(request.url).pathname;
    if (request.method === "POST" && pathname === "/api/detect-ai") return detectImage(request, env, cors);
    if (request.method !== "POST" || pathname !== "/v1/transcript") return response({ error: "Not found." }, 404, cors);
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
