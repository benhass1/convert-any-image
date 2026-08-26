/** Signal Utility: Cloudflare edge API is public; conversion stays local by default. */
function publicUrl(
  name: "VITE_WORKER_URL" | "VITE_LOCAL_BACKEND_URL",
  fallback: string,
) {
  return (import.meta.env[name] || fallback).replace(/\/$/, "");
}

export const serviceConfig = {
  get transcriptWorkerUrl() {
    return publicUrl(
      "VITE_WORKER_URL",
      "https://convert-any-image-transcript.benmhamed-hassan.workers.dev",
    );
  },
  get localBackendUrl() {
    return publicUrl("VITE_LOCAL_BACKEND_URL", "http://localhost:8000");
  },
};
