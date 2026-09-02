import { describe, expect, it } from "vitest";
import { c2paMimeType, summariseC2paManifest } from "./c2pa-provenance";

describe("summariseC2paManifest", () => {
  it("reports a manifest without failure statuses as verified", () => {
    const result = summariseC2paManifest(
      { active_manifest: "urn:c2pa:manifest", validation_results: { activeManifest: { success: [{ code: "claimSignature.validated", success: true }] } } },
      { title: "photo.jpg", claim_generator: "Trusted Camera" },
      "urn:c2pa:manifest",
    );

    expect(result).toMatchObject({ state: "verified", title: "photo.jpg", generator: "Trusted Camera", activeLabel: "urn:c2pa:manifest" });
  });

  it("reports explicit validation failures as invalid", () => {
    const result = summariseC2paManifest(
      { validation_results: { activeManifest: { failure: [{ code: "claimSignature.invalid", explanation: "Signature did not validate." }] } } },
      {},
    );

    expect(result.state).toBe("invalid");
    expect(result.validationMessages).toContain("Signature did not validate.");
  });

  it("does not infer a successful validation when a manifest has no explicit status", () => {
    const result = summariseC2paManifest({ active_manifest: "urn:c2pa:manifest" }, { title: "source.jpg" });

    expect(result.state).toBe("present");
  });

  it("uses a file-name extension when the browser does not provide a MIME type", () => {
    expect(c2paMimeType({ name: "source.HEIC", type: "" } as File)).toBe("image/heic");
  });
});
