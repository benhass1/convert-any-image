/* Signal Utility design reminder: an honest local inspection workbench with navy evidence rails, lime status cues and plain-language limits. */
import { useRef, useState } from "react";
import { FileSearch, FileType2, Info, LoaderCircle, MapPin, ScanSearch, ShieldCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import { useDefaultWorkbench } from "@/hooks/useDefaultWorkbench";
import { c2paMimeType, type C2paProvenanceReport, type C2paVerificationState, summariseC2paManifest } from "@/lib/c2pa-provenance";
import { prettySize } from "@/lib/image-processing";

type ReadState = "idle" | "reading" | "ready" | "empty" | "error";
type ExifEntry = { label: string; value: string };
type CredentialState = "idle" | "checking" | C2paVerificationState;

const exifFaqs = [
  ["Is viewing EXIF data safe?", "For standard inspection, the selected file is read in your browser. The report does not modify the original image."],
  ["Does this tool store my images?", "This page has no account or file-storage step. EXIF and Content Credentials checks happen in the browser on the device you are using."],
  ["What does a Content Credentials result mean?", "A validated credential shows that a signed C2PA manifest is present and its validation information can be read. No credential found is inconclusive; it does not identify an image as human-made or AI-made."],
  ["How can I check photo metadata without uploading?", "Choose an image, wait for the local report, then review the fields that the current browser can read from that file."],
  ["Can I remove metadata after reviewing it?", "Yes. Open the separate Remove EXIF tool to create a fresh supported JPG, PNG or WebP copy, then review the result before sharing it."],
] as const;

const reportSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://convertanyimage.com/view-exif#app",
      name: "Convert Any Image EXIF Report",
      url: "https://convertanyimage.com/view-exif",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@id": "https://convertanyimage.com/#organization" },
      description: "A browser-based EXIF report that lists readable metadata and locally checks for C2PA Content Credentials in a selected image file.",
      featureList: ["Browser-local inspection for readable EXIF fields", "Local C2PA Content Credentials validation when present", "File details and readable-field report", "No account or file-storage step", "Link to a separate EXIF-removal workflow"],
    },
    {
      "@type": "FAQPage",
      "@id": "https://convertanyimage.com/view-exif#faq",
      mainEntity: exifFaqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
    },
    {
      "@type": "WebPage",
      "@id": "https://convertanyimage.com/view-exif#webpage",
      url: "https://convertanyimage.com/view-exif",
      name: "View EXIF Data from an Image – Local Browser Report",
      description: "Inspect readable EXIF fields and locally validate any C2PA Content Credentials found in an image file, then open the local EXIF remover to prepare a new copy.",
      isPartOf: { "@id": "https://convertanyimage.com/#website" },
      author: { "@id": "https://convertanyimage.com/#organization" },
      publisher: { "@id": "https://convertanyimage.com/#organization" },
    },
  ],
};

function labelFor(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function presentValue(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "Unreadable date" : value.toLocaleString();
  if (Array.isArray(value)) return value.map(presentValue).join(", ");
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${labelFor(key)}: ${presentValue(entry)}`).join(" · ");
  return String(value);
}

export default function ViewExif() {
  useDefaultWorkbench("view-exif-upload");
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [entries, setEntries] = useState<ExifEntry[]>([]);
  const [state, setState] = useState<ReadState>("idle");
  const [message, setMessage] = useState("Choose an image to inspect the fields your browser can read.");
  const [credentialState, setCredentialState] = useState<CredentialState>("idle");
  const [credentialReport, setCredentialReport] = useState<C2paProvenanceReport>();
  const credentialRequest = useRef(0);

  const inspectCredentials = async (selected: File, requestId: number) => {
    setCredentialState("checking");
    setCredentialReport(undefined);
    let dispose: (() => void) | undefined;
    let reader: { manifestStore: () => Promise<unknown>; activeManifest: () => Promise<unknown>; activeLabel: () => Promise<string | null>; free: () => Promise<void> } | null = null;
    try {
      const [{ createC2pa }, wasmModule] = await Promise.all([
        import("@contentauth/c2pa-web"),
        import("@contentauth/c2pa-web/resources/c2pa.wasm?url"),
      ]);
      const c2pa = await createC2pa({ wasmSrc: wasmModule.default });
      dispose = c2pa.dispose;
      reader = await c2pa.reader.fromBlob(c2paMimeType(selected), selected);
      if (!reader) {
        if (requestId === credentialRequest.current) setCredentialState("not-found");
        return;
      }
      const [manifestStore, activeManifest, activeLabel] = await Promise.all([reader.manifestStore(), reader.activeManifest(), reader.activeLabel()]);
      if (requestId === credentialRequest.current) {
        const report = summariseC2paManifest(manifestStore, activeManifest, activeLabel);
        setCredentialReport(report);
        setCredentialState(report.state);
      }
    } catch {
      if (requestId === credentialRequest.current) setCredentialState("unreadable");
    } finally {
      if (reader) await reader.free().catch(() => undefined);
      dispose?.();
    }
  };

  const inspect = async (selected?: File) => {
    if (!selected) return;
    const requestId = ++credentialRequest.current;
    setFile(selected);
    setEntries([]);
    setState("reading");
    setMessage("Reading available EXIF fields locally…");
    void inspectCredentials(selected, requestId);
    try {
      const exifr = await import("exifr");
      const parsed = await exifr.parse(selected, true).catch(() => undefined) as Record<string, unknown> | undefined;
      const nextEntries = Object.entries(parsed ?? {})
        .filter(([, value]) => value !== undefined && value !== null && presentValue(value).trim().length > 0)
        .map(([key, value]) => ({ label: labelFor(key), value: presentValue(value) }))
        .sort((left, right) => left.label.localeCompare(right.label));
      setEntries(nextEntries);
      if (nextEntries.length) {
        setState("ready");
        setMessage(`${nextEntries.length} readable field${nextEntries.length === 1 ? "" : "s"} found in this file.`);
      } else {
        setState("empty");
        setMessage("No readable EXIF fields were found. The image may not contain EXIF, or this browser may not read its metadata format.");
      }
    } catch {
      setState("error");
      setMessage("This file could not be inspected in this browser. Try another image or use a desktop metadata tool for specialised formats.");
    }
  };

  return <SiteShell><Seo exactTitle title="View EXIF Data & Content Credentials – Local Browser Report" description="Inspect readable EXIF fields and locally validate any C2PA Content Credentials found in an image file." keywords="view exif data, C2PA content credentials verification, local browser-based metadata viewer, privacy-safe image inspection" jsonLd={reportSchema}/><main>
    <section id="view-exif-upload" className="scroll-mt-24 border-b border-[#132432]/10 bg-[#f4f0e8] px-5 py-5 lg:px-10 lg:py-8">
      <div className="mx-auto grid max-w-[1360px] border border-[#132432]/12 bg-[#fffdf8] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 p-5 sm:p-8"><p className="label">01 / EXIF + PROVENANCE</p><h1 className="font-display mt-2 max-w-3xl text-3xl font-bold leading-[.96] tracking-[-.06em] sm:text-4xl">View EXIF data and Content Credentials</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#52616a]">Choose an image to list readable EXIF fields and check for C2PA Content Credentials. Both checks stay local and do not modify your original.</p>
          <div className="mt-7 border border-dashed border-[#132432]/20 bg-[linear-gradient(90deg,rgba(19,36,50,.055)_1px,transparent_1px),linear-gradient(rgba(19,36,50,.055)_1px,transparent_1px)] bg-[size:20px_20px] p-7"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#132432] text-[#b7f840]"><ScanSearch className="h-5 w-5"/></span><div><p className="label text-[#5c7820]">READY / LOCAL READ</p><h2 className="font-display mt-2 text-xl font-bold tracking-[-.04em]">Choose an image to inspect</h2><p className="mt-1 text-sm text-[#52616a]">Common formats work best; readable metadata depends on the file and browser.</p></div></div><button type="button" onClick={() => input.current?.click()} className="inline-flex shrink-0 items-center gap-2 border border-[#132432] bg-[#fffdf8] px-4 py-3 text-sm font-bold transition-colors hover:bg-[#132432] hover:text-[#f4f0e8]"><FileSearch className="h-4 w-4"/>Select image</button><input ref={input} type="file" accept="image/*,.heic,.heif,.tif,.tiff" className="hidden" onChange={(event) => { void inspect(event.target.files?.[0]); event.target.value = ""; }}/></div></div>
          {state !== "idle" && <div className={`mt-5 border-l-2 p-4 text-sm leading-6 ${state === "error" ? "border-[#9c3d31] bg-[#f8e4dd] text-[#6f2d24]" : state === "ready" ? "border-[#b7f840] bg-[#e8f4cc] text-[#314753]" : "border-[#132432]/25 bg-[#f4f0e8] text-[#52616a]"}`} role="status">{state === "reading" ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin"/> : <Info className="mr-2 inline h-4 w-4"/>}{message}</div>}
          {file && <section className="mt-6 border border-[#132432]/12"><div className="flex flex-wrap items-center gap-3 border-b border-[#132432]/10 bg-[#f4f0e8] px-4 py-3"><FileType2 className="h-4 w-4 text-[#5c7820]"/><p className="min-w-0 flex-1 truncate text-sm font-bold">{file.name}</p><span className="text-xs text-[#65727b]">{prettySize(file.size)} · {file.type || "Type not supplied"}</span></div>{state === "ready" && <dl className="divide-y divide-[#132432]/10">{entries.map((entry) => <div key={`${entry.label}-${entry.value}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(150px,.32fr)_1fr] sm:gap-5"><dt className="text-xs font-bold tracking-[.06em] text-[#52616a]">{entry.label}</dt><dd className="break-words text-sm leading-6 text-[#314753]">{entry.value}</dd></div>)}</dl>}</section>}
          {file && <section className="mt-6 border border-[#132432]/12 bg-[#f4f0e8] p-5" aria-live="polite"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="label text-[#5c7820]">02 / CONTENT CREDENTIALS</p><h2 className="font-display mt-2 text-2xl font-bold tracking-[-.05em]">C2PA provenance check</h2></div>{credentialState === "verified" && <span className="border border-[#5c7820] bg-[#e8f4cc] px-3 py-2 text-xs font-bold text-[#314753]">CREDENTIAL VALIDATED</span>}{credentialState === "present" && <span className="border border-[#c07a28] bg-[#fff4df] px-3 py-2 text-xs font-bold text-[#6e4b22]">CREDENTIAL FOUND</span>}{credentialState === "invalid" && <span className="border border-[#9c3d31] bg-[#f8e4dd] px-3 py-2 text-xs font-bold text-[#6f2d24]">VALIDATION ISSUE</span>}</div>{credentialState === "checking" && <p className="mt-4 flex items-center gap-2 text-sm leading-6 text-[#52616a]"><LoaderCircle className="h-4 w-4 animate-spin text-[#5c7820]"/>Checking for a signed C2PA Content Credential locally…</p>}{credentialState === "not-found" && <p className="mt-4 text-sm leading-6 text-[#52616a]">No Content Credential was found in this file. This is inconclusive; it does not establish how the image was created.</p>}{credentialState === "unreadable" && <p className="mt-4 text-sm leading-6 text-[#52616a]">Content Credentials could not be read in this browser or from this file type. The local EXIF report above remains available.</p>}{credentialReport && <><p className="mt-4 text-sm leading-6 text-[#52616a]">{credentialReport.state === "verified" ? "A C2PA manifest was read with explicit success validation signals." : credentialReport.state === "present" ? "A C2PA manifest was found, but no explicit validation result was reported by this reader." : "A C2PA manifest was found, but the reader reported validation failure signals."}</p><dl className="mt-5 divide-y divide-[#132432]/10 border-y border-[#132432]/10">{credentialReport.title && <div className="grid gap-1 py-3 sm:grid-cols-[minmax(150px,.32fr)_1fr] sm:gap-5"><dt className="text-xs font-bold tracking-[.06em] text-[#52616a]">Manifest title</dt><dd className="break-words text-sm leading-6 text-[#314753]">{credentialReport.title}</dd></div>}{credentialReport.generator && <div className="grid gap-1 py-3 sm:grid-cols-[minmax(150px,.32fr)_1fr] sm:gap-5"><dt className="text-xs font-bold tracking-[.06em] text-[#52616a]">Claim generator</dt><dd className="break-words text-sm leading-6 text-[#314753]">{credentialReport.generator}</dd></div>}{credentialReport.activeLabel && <div className="grid gap-1 py-3 sm:grid-cols-[minmax(150px,.32fr)_1fr] sm:gap-5"><dt className="text-xs font-bold tracking-[.06em] text-[#52616a]">Active manifest</dt><dd className="break-all text-sm leading-6 text-[#314753]">{credentialReport.activeLabel}</dd></div>}</dl>{credentialReport.validationMessages.length > 0 && <ul className="mt-4 space-y-2 text-sm leading-6 text-[#52616a]">{credentialReport.validationMessages.map((entry) => <li key={entry} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#5c7820]"/>{entry}</li>)}</ul>}</>}<p className="mt-5 border-t border-[#132432]/10 pt-4 text-xs leading-5 text-[#65727b]">This is a local C2PA manifest check. A validated credential provides signed provenance information; no credential found remains inconclusive.</p></section>}
          <section className="mt-8 border-t border-[#132432]/12 pt-7"><p className="label text-[#5c7820]">HOW IT WORKS</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">How to check photo metadata without uploading</h2><ol className="mt-5 grid gap-3 sm:grid-cols-3"><li className="border border-[#132432]/12 bg-[#f4f0e8] p-4"><span className="label text-[#5c7820]">01 / SELECT</span><h3 className="font-display mt-3 text-lg font-bold tracking-[-.04em]">Choose one image</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">Select the file you want to inspect. The original remains unchanged.</p></li><li className="border border-[#132432]/12 bg-[#f4f0e8] p-4"><span className="label text-[#5c7820]">02 / REVIEW</span><h3 className="font-display mt-3 text-lg font-bold tracking-[-.04em]">Read available fields</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">Check the readable camera, date, orientation or location fields.</p></li><li className="border border-[#132432]/12 bg-[#f4f0e8] p-4"><span className="label text-[#5c7820]">03 / DECIDE</span><h3 className="font-display mt-3 text-lg font-bold tracking-[-.04em]">Keep or make a copy</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">Use the removal tool only when a new sharing copy is appropriate.</p></li></ol></section>
          <section className="mt-8 border-l-2 border-[#b7f840] bg-[#132432] p-5 text-[#f4f0e8]"><p className="label text-[#b7f840]">NEXT STEP</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">Want to remove EXIF data?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8d2c5]/72">Create a fresh JPG, PNG or WebP copy with the existing local remover. It leaves your source file unchanged.</p><a href="/remove-exif#exif-upload" className="mt-5 inline-flex items-center gap-2 bg-[#b7f840] px-4 py-3 text-sm font-bold text-[#132432] transition-transform hover:-translate-y-0.5"><ShieldCheck className="h-4 w-4"/>Open Remove EXIF</a></section>
        </div>
        <aside className="bg-[#132432] p-6 text-[#f4f0e8] sm:p-8"><p className="label text-[#b7f840]">02 / READING LIMITS</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">A report, not a guarantee</h2><p className="mt-4 text-sm leading-6 text-[#d8d2c5]/72">Not every file contains EXIF. The report shows fields the browser can read; it does not infer missing information or certify that no other metadata exists.</p><div className="mt-8 space-y-5 border-t border-[#f4f0e8]/15 pt-5 text-sm leading-6 text-[#d8d2c5]/72"><p><MapPin className="mr-2 inline h-4 w-4 text-[#b7f840]"/><strong className="text-[#f4f0e8]">Location data</strong><br/>GPS may appear when it exists and the file can be read.</p><p><FileSearch className="mr-2 inline h-4 w-4 text-[#b7f840]"/><strong className="text-[#f4f0e8]">Technical fields</strong><br/>Camera, date, orientation and other tags vary by file.</p></div></aside>
      </div>
    </section><section className="border-b border-[#132432]/10 bg-[#fffdf8] px-5 py-12 lg:px-10"><div className="mx-auto grid max-w-[1040px] gap-8 lg:grid-cols-[150px_minmax(0,1fr)]"><aside className="h-fit border-l-2 border-[#b7f840] bg-[#132432] p-5 text-[#f4f0e8] lg:sticky lg:top-28"><p className="label text-[#b7f840]">03 / FIELD NOTES</p><span className="mt-5 grid h-10 w-10 place-items-center border border-[#b7f840] text-[.58rem] font-bold tracking-[.12em] text-[#b7f840]">EXIF</span><p className="mt-6 border-t border-[#f4f0e8]/15 pt-4 text-[.63rem] font-bold tracking-[.13em] text-[#d8d2c5]/68">LOCAL INSPECTION</p><p className="mt-3 text-xs leading-5 text-[#d8d2c5]/68">Review visible fields, then choose a separate sharing copy only when needed.</p></aside><div><p className="label text-[#5c7820]">PRIVACY-SAFE IMAGE INSPECTION</p><h2 className="font-display mt-3 max-w-3xl text-3xl font-bold leading-[.98] tracking-[-.06em]">A local browser-based metadata viewer for practical photo checks.</h2><p className="mt-5 max-w-3xl font-serif text-xl leading-8 text-[#41525d]">This report is designed for a quick, private inspection before you post, share or archive an image. It lists metadata that the current browser can read; it does not infer missing fields or certify that a file contains no other data.</p><div className="mt-9 grid gap-8 lg:grid-cols-2"><section><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center bg-[#132432] text-[.6rem] font-bold text-[#b7f840]">Q</span><h2 className="font-display text-2xl font-bold tracking-[-.05em]">EXIF report questions</h2></div><div className="mt-5 divide-y divide-[#132432]/12 border-y border-[#132432]/12">{exifFaqs.map(([question, answer], index) => <div key={question} className="py-5"><p className="label text-[#5c7820]">{`0${index + 1}`} / ANSWER</p><h3 className="font-display mt-2 text-lg font-bold tracking-[-.035em]">{question}</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">{answer}</p></div>)}</div></section><aside className="border border-[#132432]/12 bg-[#e9e4da] p-6"><p className="label text-[#5c7820]">RELATED UTILITY</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">Prepare a separate sharing copy.</h2><p className="mt-3 text-sm leading-6 text-[#52616a]">After reviewing the report, use the dedicated remover to create a fresh JPG, PNG or WebP copy for supported files. Review the completed file for your own situation before you share it.</p><a href="/remove-exif#exif-upload" className="mt-5 inline-flex items-center gap-2 border-b-2 border-[#b7f840] pb-1 text-sm font-bold text-[#132432]">Remove EXIF data from a supported image<ShieldCheck className="h-4 w-4 text-[#5c7820]"/></a></aside></div></div></div></section>
  </main></SiteShell>;
}
