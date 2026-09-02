export interface Env {
  ALLOWED_ORIGINS: string;
  CACHE_TTL_SECONDS: string;
  AI: Ai;
}

type TranscriptCue = { text: string; startMs: number; durationMs: number };
type TranscriptPayload = { videoId: string; language: string; cached: boolean; cues: TranscriptCue[] };
type AuthenticityAssessment = {
  is_ai: boolean | null;
  confidence: number;
  verdict: "Likely AI-Generated" | "Likely Authentic / Human" | "Inconclusive";
  reasons: string[];
};
type EdgeAnalysisPayload = {
  success: true;
  model: string;
  analysis_type: "visual_authenticity_assessment";
  assessment: AuthenticityAssessment;
  disclaimer: string;
};

const jsonHeaders = { "Content-Type": "application/json; charset=UTF-8" };
const MAX_ANALYSIS_BYTES = 8 * 1024 * 1024;
const IMAGE_ANALYSIS_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const ASSESSMENT_PROMPT = `Review this image for visual signals that can sometimes be associated with synthetic image generation, such as implausible geometry, warped edges, inconsistent anatomy, repeated textures, or unnatural lighting. This is a probabilistic visual assessment only: you cannot establish authorship or provenance from pixels alone. Return only a JSON object with this exact shape: {"is_ai": true|false|null, "confidence": number from 0 to 100, "verdict": "Likely AI-Generated"|"Likely Authentic / Human"|"Inconclusive", "reasons": ["brief observation", "brief observation"]}. Use "Inconclusive" and null when evidence is insufficient.`;

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && !allowedOrigins.includes(origin)) return null;
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}

function response(body: unknown, status: number, cors: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...cors } });
}

function cacheKey(request: Request, videoId: string, language: string) {
  const url = new URL(request.url);
  url.pathname = `/__cache/transcript/${videoId}/${language}`;
  url.search = "";
  return new Request(url.toString());
}

function parseYouTubeEvents(payload: { events?: Array<{ segs?: Array<{ utf8?: string }>; tStartMs?: number; dDurationMs?: number }> }): TranscriptCue[] {
  return (payload.events || []).flatMap((event) => {
    const text = (event.segs || []).map((segment) => segment.utf8 || "").join("").trim();
    return text ? [{ text, startMs: event.tStartMs || 0, durationMs: event.dDurationMs || 0 }] : [];
  });
}

async function fetchTranscript(videoId: string, language: string): Promise<TranscriptCue[]> {
  const upstream = new URL("https://www.youtube.com/api/timedtext");
  upstream.searchParams.set("v", videoId);
  upstream.searchParams.set("lang", language);
  upstream.searchParams.set("fmt", "json3");
  const upstreamResponse = await fetch(upstream, { headers: { Accept: "application/json" } });
  if (upstreamResponse.status === 429) throw new Error("UPSTREAM_RATE_LIMIT");
  if (!upstreamResponse.ok) throw new Error("TRANSCRIPT_NOT_AVAILABLE");
  return parseYouTubeEvents(await upstreamResponse.json());
}

function fallbackAssessment(reason: string): AuthenticityAssessment {
  return { is_ai: null, confidence: 0, verdict: "Inconclusive", reasons: [reason] };
}

function clampConfidence(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.round(Math.max(0, Math.min(100, parsed)) * 10) / 10 : 0;
}

function parseAssessment(modelResult: unknown): AuthenticityAssessment {
  const value = modelResult && typeof modelResult === "object" ? modelResult as { response?: unknown; description?: unknown } : {};
  const raw = typeof value.response === "string" ? value.response : typeof value.description === "string" ? value.description : "";
  const withoutFences = raw.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(withoutFences.slice(start, end + 1)) as Partial<AuthenticityAssessment>;
      const verdict = parsed.verdict === "Likely AI-Generated" || parsed.verdict === "Likely Authentic / Human" || parsed.verdict === "Inconclusive" ? parsed.verdict : "Inconclusive";
      const is_ai = typeof parsed.is_ai === "boolean" ? parsed.is_ai : null;
      const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.filter((reason): reason is string => typeof reason === "string").map((reason) => reason.trim()).filter(Boolean).slice(0, 4) : [];
      return { is_ai: verdict === "Inconclusive" ? null : is_ai, confidence: clampConfidence(parsed.confidence), verdict, reasons: reasons.length ? reasons : ["The model returned no specific visual observations."] };
    } catch {
      // Fall through to cautious prose handling below.
    }
  }

  const normalized = withoutFences.toLowerCase();
  const syntheticSignal = /likely ai|ai-generated|artificially generated|synthetic image|generated by ai/.test(normalized);
  const authenticSignal = /likely authentic|appears authentic|real photograph|appears to be a real|not ai-generated/.test(normalized);
  const excerpt = withoutFences.replace(/\s+/g, " ").slice(0, 240);
  if (syntheticSignal && !authenticSignal) return { is_ai: true, confidence: 50, verdict: "Likely AI-Generated", reasons: [excerpt || "The visual model reported possible synthetic-image signals."] };
  if (authenticSignal && !syntheticSignal) return { is_ai: false, confidence: 50, verdict: "Likely Authentic / Human", reasons: [excerpt || "The visual model reported no clear synthetic-image signals."] };
  return fallbackAssessment(excerpt ? `The visual model returned an unstructured observation: ${excerpt}` : "The visual model did not return an assessment.");
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
    const modelResult = await env.AI.run(IMAGE_ANALYSIS_MODEL, { image: [...bytes], prompt: ASSESSMENT_PROMPT, max_tokens: 220, temperature: 0.1 });
    const payload: EdgeAnalysisPayload = {
      success: true,
      model: IMAGE_ANALYSIS_MODEL,
      analysis_type: "visual_authenticity_assessment",
      assessment: parseAssessment(modelResult),
      disclaimer: "This automated visual assessment can be wrong and cannot establish image authorship, provenance, or authenticity.",
    };
    return response(payload, 200, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMAGE_ANALYSIS_FAILED";
    const status = message === "IMAGE_TOO_LARGE" ? 413 : message === "IMAGE_REQUIRED" ? 400 : 502;
    const publicMessage = message === "IMAGE_TOO_LARGE" ? "Images must be 8 MB or smaller for edge analysis." : message === "IMAGE_REQUIRED" ? "An image body is required." : "Visual assessment is temporarily unavailable.";
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
