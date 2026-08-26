/** Optional client for a user-operated local Docker backend; never selected by default without its URL. */
import { serviceConfig } from "./service-config";

export async function convertWithLocalBackend(file: File, outputFormat: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("output_format", outputFormat);
  const response = await fetch(`${serviceConfig.localBackendUrl}/api/convert`, { method: "POST", body });
  if (!response.ok) throw new Error("The local converter could not complete this request.");
  return response.blob();
}
