/** Browser client for the Cloudflare transcript edge API. */
import type { TranscriptRequest, TranscriptResponse } from "@shared/contracts/transcript";
import { serviceConfig } from "./service-config";

export async function fetchTranscript(request: TranscriptRequest): Promise<TranscriptResponse> {
  const response = await fetch(`${serviceConfig.transcriptWorkerUrl}/v1/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Transcript request failed." }));
    throw new Error(payload.error || "Transcript request failed.");
  }
  return response.json() as Promise<TranscriptResponse>;
}
