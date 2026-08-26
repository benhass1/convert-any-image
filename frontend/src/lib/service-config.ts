/** Signal Utility: public URLs are explicit; secrets never enter the Vite bundle. */
function requiredPublicUrl(name: "VITE_WORKER_URL" | "VITE_LOCAL_BACKEND_URL") {
  const value = import.meta.env[name];
  if (!value) throw new Error(`${name} is not configured. Copy .env.example and provide a public endpoint.`);
  return value.replace(/\/$/, "");
}

export const serviceConfig = {
  get transcriptWorkerUrl() { return requiredPublicUrl("VITE_WORKER_URL"); },
  get localBackendUrl() { return requiredPublicUrl("VITE_LOCAL_BACKEND_URL"); },
};
