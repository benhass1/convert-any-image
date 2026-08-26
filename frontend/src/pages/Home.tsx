/**
 * Signal Utility design reminder: keep conversion capabilities explicit, local and mobile-usable.
 */
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowRight, Box, Check, ChevronDown, Files, FolderUp, LoaderCircle, LockKeyhole, Plus, ScanLine, X } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import { convertImage, downloadBlob, extensionOf, formatFor, formatRegistry, OutputFormat, outputFormats, prettySize, ProcessingPhase, supportedInputExtensions } from "@/lib/image-processing";

type Stage = "queued" | ProcessingPhase | "done" | "failed";
type ConversionItem = { id: string; file: File; previewUrl: string; output: OutputFormat; stage: Stage; results?: Blob[]; error?: string };

const heroUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23132432'/%3E%3Cg stroke='%23b7f840' stroke-opacity='.35' fill='none'%3E%3Cpath d='M1000 0V900M1200 0V900M1400 0V900M0 160H1600M0 360H1600M0 560H1600M0 760H1600'/%3E%3Crect x='980' y='180' width='400' height='270' stroke-width='8'/%3E%3Ccircle cx='1200' cy='315' r='105' stroke-width='22'/%3E%3C/g%3E%3C/svg%3E";
const phaseCopy: Record<Stage, string> = { queued: "QUEUED", "loading-engine": "LOADING", decoding: "DECODING", converting: "CONVERTING", packaging: "PACKAGING", done: "READY", failed: "RETRY" };

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrls = useRef(new Set<string>());
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [globalOutput, setGlobalOutput] = useState<OutputFormat>("webp");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const groupedFormats = useMemo(() => Array.from(new Set(formatRegistry.map((format) => format.category))).map((category) => ({ category, formats: formatRegistry.filter((format) => format.category === category) })), []);

  useEffect(() => () => { previewUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const patchItem = (id: string, change: Partial<ConversionItem>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...change } : item));
  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const invalid = incoming.filter((file) => !supportedInputExtensions.has(extensionOf(file.name)));
    const accepted = incoming.filter((file) => supportedInputExtensions.has(extensionOf(file.name))).map((file) => { const previewUrl = URL.createObjectURL(file); previewUrls.current.add(previewUrl); return { id: crypto.randomUUID(), file, previewUrl, output: globalOutput, stage: "queued" as Stage }; });
    if (invalid.length) setNotice(`${invalid.length} file${invalid.length === 1 ? " was" : "s were"} skipped because the extension is not in the supported registry.`);
    if (accepted.length) setItems((current) => [...current, ...accepted]);
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files); };
  const removeItem = (id: string) => setItems((current) => { const item = current.find((entry) => entry.id === id); if (item) { URL.revokeObjectURL(item.previewUrl); previewUrls.current.delete(item.previewUrl); } return current.filter((entry) => entry.id !== id); });
  const changeGlobalOutput = (output: OutputFormat) => { setGlobalOutput(output); setItems((current) => current.map((item) => item.stage === "queued" || item.stage === "failed" ? { ...item, output } : item)); };
  const convertAll = async () => {
    const queue = items.filter((item) => item.stage === "queued" || item.stage === "failed");
    if (!queue.length) return;
    setIsConverting(true); setNotice(null);
    for (const item of queue) {
      patchItem(item.id, { stage: "loading-engine", error: undefined, results: undefined });
      try {
        const results = await convertImage(item.file, item.output, (stage) => patchItem(item.id, { stage }));
        patchItem(item.id, { stage: "done", results });
      } catch (error) {
        patchItem(item.id, { stage: "failed", error: error instanceof Error ? error.message : "Conversion stopped." });
      }
    }
    setIsConverting(false);
  };
  const downloadItem = async (item: ConversionItem) => {
    if (!item.results?.length) return;
    const format = formatFor(item.output); const base = item.file.name.replace(/\.[^.]+$/, "");
    if (item.results.length === 1) { downloadBlob(item.results[0], `${base}.${format.ext}`); return; }
    const { default: JSZip } = await import("jszip"); const zip = new JSZip();
    item.results.forEach((blob, index) => zip.file(`${base}-page-${index + 1}.${format.ext}`, blob));
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${base}-${format.label.toLowerCase()}.zip`);
  };
  const downloadAll = async () => {
    const ready = items.filter((item) => item.stage === "done" && item.results?.length);
    if (!ready.length) return;
    if (ready.length === 1) return downloadItem(ready[0]);
    const { default: JSZip } = await import("jszip"); const zip = new JSZip();
    ready.forEach((item) => { const format = formatFor(item.output); item.results!.forEach((blob, index) => zip.file(`${item.file.name.replace(/\.[^.]+$/, "")}${item.results!.length > 1 ? `-page-${index + 1}` : ""}.${format.ext}`, blob)); });
    downloadBlob(await zip.generateAsync({ type: "blob" }), "convert-any-image.zip");
  };
  const complete = items.filter((item) => item.stage === "done").length;
  const working = items.filter((item) => ["loading-engine", "decoding", "converting", "packaging"].includes(item.stage)).length;

  return <SiteShell><Seo title="Private image converter" description="Convert standard, mobile, vector, document, RAW, design and HDR image formats locally in your browser."/><main>
    <section className="relative overflow-hidden bg-[#132432] text-[#f4f0e8]">
      <img src={heroUrl} alt="Abstract image conversion lab" className="absolute inset-0 h-full w-full object-cover object-right opacity-45"/><div className="absolute inset-0 bg-[linear-gradient(90deg,#132432_0%,#132432_36%,rgba(19,36,50,.86)_56%,rgba(19,36,50,.48)_100%)]"/>
      <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-14 lg:px-10 lg:pb-24 lg:pt-20"><div className="max-w-3xl">
        <div className="mb-6 flex items-center gap-3 text-[.72rem] font-bold tracking-[.17em] text-[#b7f840]"><span className="h-2.5 w-2.5 rounded-full bg-[#b7f840]"/>PRIVATE BROWSER PROCESSING</div>
        <h1 className="font-display text-5xl font-bold leading-[.93] tracking-[-.075em] sm:text-6xl lg:text-8xl">Every format.<br/><span><i className="mr-3 inline-block h-[.7em] w-[.18em] bg-[#b7f840] not-italic"/>Your device.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-[#e6e1d8]/78 sm:text-lg">Convert, compress and download images without uploading them to a cloud server. The file stays on your device from drop zone to download.</p>
        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#e6e1d8]/82"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#b7f840]"/>No upload</span><span className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-[#b7f840]"/>Format registry</span><span className="flex items-center gap-2"><Files className="h-4 w-4 text-[#b7f840]"/>ZIP output</span></div>
      </div></div>
    </section>
    <section className="relative mx-auto -mt-7 max-w-[1440px] px-3 pb-20 sm:px-5 lg:-mt-10 lg:px-10 lg:pb-28">
      <div className="grid overflow-hidden border border-[#132432]/12 bg-[#f7f4ee] shadow-[0_24px_80px_rgba(19,36,50,.14)] lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="label">01 / DROP FILES</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-.06em]">Conversion workbench</h2></div><span className="rounded-full bg-[#132432] px-3 py-1.5 text-[.67rem] font-bold tracking-[.13em] text-[#f4f0e8]">{items.length.toString().padStart(2, "0")} FILE{items.length === 1 ? "" : "S"}</span></div>
          <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} onClick={() => fileInput.current?.click()} className={`group relative grid min-h-[210px] cursor-pointer place-items-center overflow-hidden border-2 border-dashed p-5 text-center transition-all sm:min-h-[230px] sm:p-8 ${isDragging ? "border-[#5c7820] bg-[#b7f840]/20" : "border-[#132432]/16 bg-[#eee9de] hover:border-[#5c7820] hover:bg-[#e8f4cc]"}`}>
            <div className="absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(19,36,50,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(19,36,50,.22)_1px,transparent_1px)] [background-size:24px_24px]"/><div className="relative"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#132432] text-[#b7f840]"><FolderUp className="h-6 w-6"/></div><p className="font-display text-xl font-bold tracking-[-.05em]">Drop image files here</p><p className="mt-2 text-sm text-[#41525d]">or select files from your device</p><p className="mt-5 text-[.61rem] font-bold tracking-[.11em] text-[#65727b] sm:text-[.67rem] sm:tracking-[.13em]">STANDARD · RAW · VECTOR · DOCUMENT · HDR</p></div>
            <input ref={fileInput} type="file" className="hidden" multiple accept="image/*,.heic,.heif,.jxl,.svg,.eps,.pdf,.cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.psd,.tga,.exr,.hdr,.cur" onChange={onChange}/>
          </div>
          {notice && <div className="mt-4 flex items-start gap-3 border border-[#b68122]/30 bg-[#fff3cf] p-3 text-sm text-[#6a4814]"><AlertTriangle className="mt-.5 h-4 w-4 shrink-0"/><span>{notice}</span><button className="ml-auto" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X className="h-4 w-4"/></button></div>}
          {items.length > 0 && <div className="mt-5 overflow-hidden border border-[#132432]/10 bg-white"><div className="hidden grid-cols-[minmax(0,1fr)_120px_120px_40px] items-center gap-3 border-b border-[#132432]/10 bg-[#f1eee7] px-4 py-3 text-[.64rem] font-bold tracking-[.13em] text-[#65727b] sm:grid"><span>FILE</span><span>OUTPUT</span><span>STATUS</span><span/></div>{items.map((item) => <FileRow key={item.id} item={item} onOutput={(output) => patchItem(item.id, { output, stage: "queued", error: undefined, results: undefined })} onRemove={() => removeItem(item.id)} onDownload={() => downloadItem(item)}/>)}</div>}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#41525d] hover:text-[#132432]"><Plus className="h-4 w-4"/>Add files</button><div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3"><button disabled={!complete} onClick={downloadAll} className="action-secondary justify-center"><ArrowDownToLine className="h-4 w-4"/>Download {complete > 1 ? "ZIP" : "file"}</button><button disabled={!items.length || isConverting} onClick={convertAll} className="action-primary justify-center">{isConverting ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <ArrowRight className="h-4 w-4"/>}{isConverting ? `${working || 1} running` : "Convert all"}</button></div></div>
        </div>
        <aside className="border-t border-[#132432]/12 bg-[#132432] p-5 text-[#f4f0e8] sm:p-6 lg:border-l lg:border-t-0 lg:p-8"><p className="label text-[#b7f840]">02 / CHOOSE OUTPUT</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-.06em]">Target format</h2><label className="relative mt-6 block"><span className="mb-2 block text-[.67rem] font-bold tracking-[.13em] text-[#d8d2c5]/60">GLOBAL SETTING</span><select value={globalOutput} onChange={(event) => changeGlobalOutput(event.target.value as OutputFormat)} className="w-full appearance-none border border-[#f4f0e8]/20 bg-[#19313f] px-4 py-3.5 pr-9 font-display text-lg font-bold tracking-[-.04em] outline-none focus:border-[#b7f840]">{outputFormats.map((format) => <option key={format.value} value={format.value}>{format.label} — {format.family}</option>)}</select><ChevronDown className="pointer-events-none absolute bottom-4 right-3.5 h-4 w-4 text-[#b7f840]"/></label><div className="mt-7 max-h-[355px] space-y-5 overflow-y-auto pr-1">{groupedFormats.map((group) => <div key={group.category}><p className="mb-2 text-[.61rem] font-bold tracking-[.14em] text-[#d8d2c5]/50">{group.category.toUpperCase()}</p><div className="flex flex-wrap gap-1.5">{group.formats.map((format) => <span key={format.label} title={`${format.direction}; ${format.status === "native" ? "fast browser path" : "loaded on demand through ImageMagick WASM"}`} className={`border px-2 py-1 text-[.62rem] font-bold tracking-[.06em] ${format.status === "native" ? "border-[#b7f840]/35 text-[#b7f840]" : "border-[#f4f0e8]/18 text-[#d8d2c5]/78"}`}>{format.extensions.map((extension) => extension.toUpperCase()).join("/")}</span>)}</div></div>)}</div><div className="mt-7 border-t border-[#f4f0e8]/16 pt-5"><div className="flex gap-3"><Box className="mt-.5 h-4 w-4 shrink-0 text-[#b7f840]"/><p className="text-sm leading-6 text-[#d8d2c5]/80"><strong className="font-semibold text-[#f4f0e8]">Complete registry.</strong> Green tags use a browser-native route, including PSD export for standard images; grey tags load WASM when needed.</p></div></div></aside>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3"><StatCard count="01" title="Drop every requested family" description="Standard, mobile, vector, document, RAW camera, design and HDR extensions are accepted."/><StatCard count="02" title="Use the right local engine" description="Standard image outputs use browser-native encoders; specialized sources load their dedicated decoder only when needed."/><StatCard count="03" title="Keep multi-page output organised" description="Multi-frame results can be downloaded as an automatic ZIP package."/></div>
    </section>
    <section className="border-y border-[#132432]/10 bg-[#e9e4da] px-5 py-16 lg:px-10 lg:py-20"><div className="mx-auto grid max-w-[1220px] gap-10 md:grid-cols-[.8fr_1.2fr]"><p className="label">FORMAT COVERAGE / TRANSPARENCY</p><div><h2 className="font-display max-w-2xl text-4xl font-bold leading-[.98] tracking-[-.07em]">No format family is hidden behind an upload wall.</h2><p className="mt-5 max-w-xl text-[1.02rem] leading-7 text-[#41525d]">Every accepted format stays local. Standard image-to-PDF and image-to-PSD conversion use browser-native routes; specialized source formats can still invoke an on-demand local decoder.</p></div></div></section>
  </main></SiteShell>;
}

function FileThumbnail({ item, ext }: { item: ConversionItem; ext: string }) {
  const [hasPreviewError, setHasPreviewError] = useState(false);
  return <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-[#132432]/15 bg-[#132432] shadow-sm"><img src={item.previewUrl} alt={`Preview of ${item.file.name}`} onError={() => setHasPreviewError(true)} className={`h-full w-full object-cover ${hasPreviewError ? "hidden" : "block"}`}/>{hasPreviewError && <span className="grid h-full w-full place-items-center px-1 text-center text-[.55rem] font-bold text-[#b7f840]">{ext.slice(0, 4)}</span>}<span className="absolute bottom-0 left-0 bg-[#132432]/85 px-1 py-[1px] text-[.46rem] font-bold tracking-[.08em] text-[#f4f0e8]">PREVIEW</span></div>;
}

function FileRow({ item, onOutput, onRemove, onDownload }: { item: ConversionItem; onOutput: (output: OutputFormat) => void; onRemove: () => void; onDownload: () => void }) {
  const ext = extensionOf(item.file.name).toUpperCase(); const resultSize = item.results?.reduce((total, result) => total + result.size, 0);
  const status = <span className={`flex items-center gap-1.5 text-[.61rem] font-bold tracking-[.07em] ${item.stage === "done" ? "text-[#5c7820]" : item.stage === "failed" ? "text-[#a1442a]" : "text-[#65727b]"}`}>{item.stage === "done" ? <Check className="h-3.5 w-3.5"/> : item.stage === "queued" ? <span className="h-1.5 w-1.5 rounded-full bg-current"/> : <LoaderCircle className="h-3.5 w-3.5 animate-spin"/>}{phaseCopy[item.stage]}</span>;
  const action = item.stage === "done" ? <button onClick={onDownload} className="grid h-8 w-8 place-items-center text-[#132432] hover:bg-[#b7f840]" aria-label="Download"><ArrowDownToLine className="h-4 w-4"/></button> : <button onClick={onRemove} className="grid h-8 w-8 place-items-center text-[#65727b] hover:bg-[#ede6dd] hover:text-[#132432]" aria-label="Remove"><X className="h-4 w-4"/></button>;
  return <div className="border-b border-[#132432]/8 px-3 py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1fr)_120px_120px_40px] sm:items-center sm:gap-3 sm:px-4"><div className="min-w-0"><div className="flex items-center gap-3"><FileThumbnail item={item} ext={ext}/><div className="min-w-0"><p className="truncate text-sm font-bold">{item.file.name}</p><p className="mt-.5 text-xs text-[#65727b]">{prettySize(item.file.size)}{resultSize ? ` → ${prettySize(resultSize)}` : ""}</p></div></div>{item.error && <p className="mt-1 max-w-md text-xs leading-4 text-[#a1442a]">{item.error}</p>}</div><div className="mt-3 flex items-center gap-2 sm:contents"><select value={item.output} disabled={item.stage !== "queued" && item.stage !== "failed"} onChange={(event) => onOutput(event.target.value as OutputFormat)} className="min-w-0 flex-1 border border-[#132432]/14 bg-white px-2 py-2 text-xs font-bold outline-none disabled:opacity-60 sm:w-auto sm:flex-none">{outputFormats.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}</select><div className="min-w-[75px] sm:min-w-0">{status}</div>{action}</div></div>;
}

function StatCard({ count, title, description }: { count: string; title: string; description: string }) { return <div className="border-l-2 border-[#b7f840] bg-[#f7f4ee] p-5"><p className="text-[.66rem] font-bold tracking-[.14em] text-[#5c7820]">{count}</p><h3 className="font-display mt-2 text-lg font-bold tracking-[-.04em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">{description}</p></div>; }
