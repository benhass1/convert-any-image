/* Signal Utility design reminder: an honest local inspection workbench with navy evidence rails, lime status cues and plain-language limits. */
import { useRef, useState } from "react";
import { FileSearch, FileType2, Info, LoaderCircle, MapPin, ScanSearch, ShieldCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import { prettySize } from "@/lib/image-processing";

type ReadState = "idle" | "reading" | "ready" | "empty" | "error";
type ExifEntry = { label: string; value: string };

const reportSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://convertanyimage.com/view-exif#webpage",
  url: "https://convertanyimage.com/view-exif",
  name: "View EXIF Data from an Image – Local Browser Report",
  description: "Inspect EXIF fields that your browser can read from an image file, then open the local EXIF remover to prepare a new copy.",
  isPartOf: { "@id": "https://convertanyimage.com/#website" },
  author: { "@id": "https://convertanyimage.com/#organization" },
  publisher: { "@id": "https://convertanyimage.com/#organization" },
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
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [entries, setEntries] = useState<ExifEntry[]>([]);
  const [state, setState] = useState<ReadState>("idle");
  const [message, setMessage] = useState("Choose an image to inspect the fields your browser can read.");

  const inspect = async (selected?: File) => {
    if (!selected) return;
    setFile(selected);
    setEntries([]);
    setState("reading");
    setMessage("Reading available EXIF fields locally…");
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

  return <SiteShell><Seo exactTitle title="View EXIF Data from an Image – Local Browser Report" description="Inspect EXIF fields that your browser can read from an image file, then open the local EXIF remover to prepare a new copy." keywords="view exif data, image metadata viewer, check photo exif, local exif report" jsonLd={reportSchema}/><main>
    <section className="border-b border-[#132432]/10 bg-[#f4f0e8] px-5 py-5 lg:px-10 lg:py-8">
      <div className="mx-auto grid max-w-[1360px] border border-[#132432]/12 bg-[#fffdf8] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 p-5 sm:p-8"><p className="label">01 / EXIF REPORT</p><h1 className="font-display mt-2 max-w-3xl text-3xl font-bold leading-[.96] tracking-[-.06em] sm:text-4xl">View image EXIF data <span className="text-[#5c7820]">on your device</span></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#52616a]">Choose an image file to list the EXIF fields that are available to this browser. The report stays local and does not modify your original.</p>
          <div className="mt-7 border border-dashed border-[#132432]/20 bg-[linear-gradient(90deg,rgba(19,36,50,.055)_1px,transparent_1px),linear-gradient(rgba(19,36,50,.055)_1px,transparent_1px)] bg-[size:20px_20px] p-7"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#132432] text-[#b7f840]"><ScanSearch className="h-5 w-5"/></span><div><h2 className="font-display text-xl font-bold tracking-[-.04em]">Choose an image to inspect</h2><p className="mt-1 text-sm text-[#52616a]">Common formats work best; readable metadata depends on the file and browser.</p></div></div><button type="button" onClick={() => input.current?.click()} className="inline-flex shrink-0 items-center gap-2 border border-[#132432] bg-[#fffdf8] px-4 py-3 text-sm font-bold transition-colors hover:bg-[#132432] hover:text-[#f4f0e8]"><FileSearch className="h-4 w-4"/>Select image</button><input ref={input} type="file" accept="image/*,.heic,.heif,.tif,.tiff" className="hidden" onChange={(event) => { void inspect(event.target.files?.[0]); event.target.value = ""; }}/></div></div>
          {state !== "idle" && <div className={`mt-5 border-l-2 p-4 text-sm leading-6 ${state === "error" ? "border-[#9c3d31] bg-[#f8e4dd] text-[#6f2d24]" : state === "ready" ? "border-[#b7f840] bg-[#e8f4cc] text-[#314753]" : "border-[#132432]/25 bg-[#f4f0e8] text-[#52616a]"}`} role="status">{state === "reading" ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin"/> : <Info className="mr-2 inline h-4 w-4"/>}{message}</div>}
          {file && <section className="mt-6 border border-[#132432]/12"><div className="flex flex-wrap items-center gap-3 border-b border-[#132432]/10 bg-[#f4f0e8] px-4 py-3"><FileType2 className="h-4 w-4 text-[#5c7820]"/><p className="min-w-0 flex-1 truncate text-sm font-bold">{file.name}</p><span className="text-xs text-[#65727b]">{prettySize(file.size)} · {file.type || "Type not supplied"}</span></div>{state === "ready" && <dl className="divide-y divide-[#132432]/10">{entries.map((entry) => <div key={`${entry.label}-${entry.value}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(150px,.32fr)_1fr] sm:gap-5"><dt className="text-xs font-bold tracking-[.06em] text-[#52616a]">{entry.label}</dt><dd className="break-words text-sm leading-6 text-[#314753]">{entry.value}</dd></div>)}</dl>}</section>}
          <section className="mt-8 border-l-2 border-[#b7f840] bg-[#132432] p-5 text-[#f4f0e8]"><p className="label text-[#b7f840]">NEXT STEP</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">Want to remove EXIF data?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8d2c5]/72">Create a fresh JPG, PNG or WebP copy with the existing local remover. It leaves your source file unchanged.</p><a href="/remove-exif#exif-upload" className="mt-5 inline-flex items-center gap-2 bg-[#b7f840] px-4 py-3 text-sm font-bold text-[#132432] transition-transform hover:-translate-y-0.5"><ShieldCheck className="h-4 w-4"/>Open Remove EXIF</a></section>
        </div>
        <aside className="bg-[#132432] p-6 text-[#f4f0e8] sm:p-8"><p className="label text-[#b7f840]">02 / READING LIMITS</p><h2 className="font-display mt-3 text-2xl font-bold tracking-[-.05em]">A report, not a guarantee</h2><p className="mt-4 text-sm leading-6 text-[#d8d2c5]/72">Not every file contains EXIF. The report shows fields the browser can read; it does not infer missing information or certify that no other metadata exists.</p><div className="mt-8 space-y-5 border-t border-[#f4f0e8]/15 pt-5 text-sm leading-6 text-[#d8d2c5]/72"><p><MapPin className="mr-2 inline h-4 w-4 text-[#b7f840]"/><strong className="text-[#f4f0e8]">Location data</strong><br/>GPS may appear when it exists and the file can be read.</p><p><FileSearch className="mr-2 inline h-4 w-4 text-[#b7f840]"/><strong className="text-[#f4f0e8]">Technical fields</strong><br/>Camera, date, orientation and other tags vary by file.</p></div></aside>
      </div>
    </section>
  </main></SiteShell>;
}
