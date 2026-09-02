export type C2paVerificationState = "verified" | "present" | "invalid" | "not-found" | "unreadable";

export type C2paProvenanceReport = {
  state: Exclude<C2paVerificationState, "not-found" | "unreadable">;
  activeLabel?: string;
  title?: string;
  generator?: string;
  validationMessages: string[];
};

type StatusMessage = { code?: string; explanation?: string; success?: boolean };

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map(text).filter((entry): entry is string => Boolean(entry)).join(", ") || undefined;
  const item = record(value);
  return item ? text(item.name) : undefined;
}

function collectValidation(value: unknown, messages: StatusMessage[] = []): StatusMessage[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValidation(item, messages));
    return messages;
  }

  const item = record(value);
  if (!item) return messages;
  if (typeof item.code === "string" || typeof item.explanation === "string") {
    messages.push({
      code: typeof item.code === "string" ? item.code : undefined,
      explanation: typeof item.explanation === "string" ? item.explanation : undefined,
      success: typeof item.success === "boolean" ? item.success : undefined,
    });
    return messages;
  }

  collectValidation(item.failure, messages);
  collectValidation(item.success, messages);
  collectValidation(item.informational, messages);
  collectValidation(item.activeManifest, messages);
  return messages;
}

/** Converts the SDK's manifest-store shape into copy that is safe to display. */
export function summariseC2paManifest(manifestStore: unknown, activeManifest: unknown, activeLabel?: string | null): C2paProvenanceReport {
  const store = record(manifestStore) ?? {};
  const manifest = record(activeManifest) ?? {};
  const statuses = [
    ...collectValidation(store.validation_status),
    ...collectValidation(store.validation_results),
    ...collectValidation(manifest.validation_status),
    ...collectValidation(manifest.validation_results),
  ];
  const hasFailure = statuses.some((status) => status.success === false || status.code?.toLowerCase().includes("error") || status.code?.toLowerCase().includes("invalid"));
  const hasExplicitSuccess = statuses.some((status) => status.success === true || status.code?.toLowerCase().includes("validated"));
  const validationMessages = statuses.map((status) => status.explanation || status.code).filter((message): message is string => Boolean(message)).slice(0, 4);

  return {
    state: hasFailure ? "invalid" : hasExplicitSuccess ? "verified" : "present",
    activeLabel: activeLabel || text(manifest.label) || text(store.active_manifest),
    title: text(manifest.title),
    generator: text(manifest.claim_generator),
    validationMessages,
  };
}

export function c2paMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", heic: "image/heic", heif: "image/heif", tif: "image/tiff", tiff: "image/tiff" } as Record<string, string>)[extension ?? ""] || "application/octet-stream";
}
