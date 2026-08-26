/**
 * Signal Utility design reminder: a decisive L-shaped workbench where states are explicit and privacy is tangible.
 */
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowRight, Check, ChevronDown, FileImage, Files, FolderUp, LoaderCircle, LockKeyhole, Plus, ScanLine, X } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { CoreOutputMime, convertImage, coreOutputFormats, downloadBlob, extensionOf, formatGroups, prettySize, readyExtensions, supportedInputExtensions } from "@/lib/image-processing";

type Stage = "queued" | "decoding" | "converting" | "done" | "failed";
type ConversionItem = { id: string; file: File; output: CoreOutputMime; stage: Stage; result?: Blob; error?: string };

const heroUrl = "/manus-storage/convert-any-image-hero_ce959f50.jpg";

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [globalOutput, setGlobalOutput] = useState<CoreOutputMime>("image/webp");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const invalid = incoming.filter((file) => !supportedInputExtensions.has(extensionOf(file.name)));
    const accepted = incoming.filter((file) => supportedInputExtensions.has(extensionOf(file.name))).map((file) => ({ id: crypto.randomUUID(), file, output: globalOutput, stage: "queued" as Stage }));
    if (invalid.length) setNotice(`${invalid.length} fichier(s) ignoré(s) : format non reconnu.`);
    if (accepted.length) setItems((current) => [...current, ...accepted]);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files); };
  const patchItem = (id: string, update: Partial<ConversionItem>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  const changeGlobalOutput = (value: CoreOutputMime) => { setGlobalOutput(value); setItems((current) => current.map((item) => item.stage === "queued" ? { ...item, output: value } : item)); };

  const convertAll = async () => {
    const queue = items.filter((item) => item.stage === "queued" || item.stage === "failed");
    if (!queue.length) return;
    setIsConverting(true); setNotice(null);
    for (const item of queue) {
      patchItem(item.id, { stage: "decoding", error: undefined });
      try {
        const result = await convertImage(item.file, item.output, (stage) => patchItem(item.id, { stage }));
        patchItem(item.id, { stage: "done", result });
      } catch (error) { patchItem(item.id, { stage: "failed", error: error instanceof Error ? error.message : "Conversion interrompue." }); }
    }
    setIsConverting(false);
  };

  const downloadAll = async () => {
    const done = items.filter((item) => item.stage === "done" && item.result);
    if (!done.length) return;
    if (done.length === 1) { const item = done[0]; downloadBlob(item.result!, outputName(item)); return; }
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    done.forEach((item) => zip.file(outputName(item), item.result!));
    downloadBlob(await zip.generateAsync({ type: "blob" }), "convert-any-image.zip");
  };

  const completed = items.filter((item) => item.stage === "done").length;
  const working = items.filter((item) => item.stage === "decoding" || item.stage === "converting").length;
  return <SiteShell>
    <main>
      <section className="relative overflow-hidden bg-[#132432] text-[#f4f0e8]">
        <img src={heroUrl} alt="Atelier photographique abstrait" className="absolute inset-0 h-full w-full object-cover object-right opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#132432_0%,#132432_36%,rgba(19,36,50,.86)_56%,rgba(19,36,50,.48)_100%)]" />
        <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-14 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3 text-[0.72rem] font-bold tracking-[0.17em] text-[#b7f840]"><span className="h-2.5 w-2.5 rounded-full bg-[#b7f840]" /> TRAITEMENT CÔTÉ NAVIGATEUR</div>
            <h1 className="font-display max-w-3xl text-5xl font-bold leading-[0.93] tracking-[-0.075em] sm:text-6xl lg:text-8xl">Chaque format.<br/><span className="relative text-[#f4f0e8]"><i className="mr-3 inline-block h-[.7em] w-[.18em] bg-[#b7f840] not-italic"/>Sur votre appareil.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#e6e1d8]/78 sm:text-lg">Convertissez, compressez et téléchargez vos images sans les envoyer vers un serveur. Les fichiers restent entre vos mains, du dépôt au téléchargement.</p>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#e6e1d8]/82"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#b7f840]" /> Zéro téléversement</span><span className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-[#b7f840]" /> Lot multi-fichiers</span><span className="flex items-center gap-2"><Files className="h-4 w-4 text-[#b7f840]" /> Archive ZIP</span></div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto -mt-7 max-w-[1440px] px-5 pb-20 lg:-mt-10 lg:px-10 lg:pb-28">
        <div className="grid overflow-hidden border border-[#132432]/12 bg-[#f7f4ee] shadow-[0_24px_80px_rgba(19,36,50,.14)] lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="label">01 / DÉPOSEZ</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-0.06em]">Table de conversion</h2></div><span className="rounded-full bg-[#132432] px-3 py-1.5 text-[0.67rem] font-bold tracking-[0.13em] text-[#f4f0e8]">{items.length.toString().padStart(2, "0")} FICHIER{items.length === 1 ? "" : "S"}</span></div>
            <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} onClick={() => fileInput.current?.click()} className={`group relative grid min-h-[230px] cursor-pointer place-items-center overflow-hidden border-2 border-dashed p-8 text-center transition-all ${isDragging ? "border-[#5c7820] bg-[#b7f840]/20" : "border-[#132432]/16 bg-[#eee9de] hover:border-[#5c7820] hover:bg-[#e8f4cc]"}`}>
              <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(19,36,50,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(19,36,50,.22)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="relative"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#132432] text-[#b7f840] transition-transform duration-200 group-hover:-translate-y-1"><FolderUp className="h-6 w-6" /></div><p className="font-display text-xl font-bold tracking-[-0.05em]">Déposez vos images ici</p><p className="mt-2 text-sm text-[#41525d]">ou choisissez des fichiers depuis votre appareil</p><p className="mt-5 text-[0.67rem] font-bold tracking-[0.13em] text-[#65727b]">JPG · PNG · WEBP · AVIF · HEIC · TIFF · SVG +</p></div>
              <input ref={fileInput} type="file" className="hidden" multiple accept="image/*,.heic,.heif,.tif,.tiff,.svg,.jxl,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.psd,.tga,.exr,.hdr,.eps,.pdf" onChange={onChange} />
            </div>
            {notice && <div className="mt-4 flex items-start gap-3 border border-[#b68122]/30 bg-[#fff3cf] p-3 text-sm text-[#6a4814]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span><button className="ml-auto" onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></div>}
            {items.length > 0 && <div className="mt-5 overflow-hidden border border-[#132432]/10 bg-white"><div className="grid grid-cols-[minmax(0,1fr)_120px_105px_40px] items-center gap-3 border-b border-[#132432]/10 bg-[#f1eee7] px-4 py-3 text-[0.64rem] font-bold tracking-[0.13em] text-[#65727b]"><span>FICHIER</span><span>SORTIE</span><span>ÉTAT</span><span /></div>{items.map((item) => <FileRow key={item.id} item={item} onOutput={(output) => patchItem(item.id, { output })} onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} onDownload={() => item.result && downloadBlob(item.result, outputName(item))} />)}</div>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 text-sm font-bold text-[#41525d] hover:text-[#132432]"><Plus className="h-4 w-4" /> Ajouter des fichiers</button><div className="flex flex-wrap gap-3"><button disabled={!completed} onClick={downloadAll} className="action-secondary"><ArrowDownToLine className="h-4 w-4" /> Télécharger {completed > 1 ? "le ZIP" : "le fichier"}</button><button disabled={!items.length || isConverting} onClick={convertAll} className="action-primary">{isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {isConverting ? `${working || 1} en cours` : "Convertir tout"}</button></div></div>
          </div>
          <aside className="border-t border-[#132432]/12 bg-[#132432] p-6 text-[#f4f0e8] lg:border-l lg:border-t-0 lg:p-8">
            <p className="label text-[#b7f840]">02 / CHOISISSEZ</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-0.06em]">Format de sortie</h2>
            <label className="relative mt-6 block"><span className="mb-2 block text-[0.67rem] font-bold tracking-[0.13em] text-[#d8d2c5]/60">RÉGLAGE GLOBAL</span><select value={globalOutput} onChange={(event) => changeGlobalOutput(event.target.value as CoreOutputMime)} className="w-full appearance-none border border-[#f4f0e8]/20 bg-[#19313f] px-4 py-3.5 pr-9 font-display text-lg font-bold tracking-[-0.04em] outline-none transition-colors focus:border-[#b7f840]">{coreOutputFormats.map((format) => <option key={format.value} value={format.value}>{format.label} — {format.note}</option>)}</select><ChevronDown className="pointer-events-none absolute bottom-4 right-3.5 h-4 w-4 text-[#b7f840]" /></label>
            <div className="mt-9 space-y-6">{formatGroups.map((group) => <div key={group.title}><p className="mb-2 text-[0.62rem] font-bold tracking-[0.15em] text-[#d8d2c5]/52">{group.title}</p><div className="flex flex-wrap gap-2">{group.formats.map((format) => <span key={format} className={`border px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.07em] ${["WEBP", "JPG", "PNG", "AVIF"].includes(format) ? "border-[#b7f840]/45 bg-[#b7f840]/10 text-[#b7f840]" : "border-[#f4f0e8]/15 text-[#d8d2c5]/75"}`}>{format}</span>)}</div></div>)}</div>
            <div className="mt-9 border-t border-[#f4f0e8]/16 pt-6"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#b7f840]"/><p className="text-sm leading-6 text-[#d8d2c5]/80"><strong className="font-semibold text-[#f4f0e8]">Traitement local.</strong> Les fichiers sont décodés dans cet onglet et supprimés à sa fermeture.</p></div></div>
          </aside>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3"><StatCard count="01" title="Déposez en lot" description="Ajoutez plusieurs fichiers et attribuez un format différent à chacun si besoin."/><StatCard count="02" title="Suivez chaque phase" description="Décodage, conversion, résultat et exceptions sont affichés par fichier."/><StatCard count="03" title="Emportez le résultat" description="Téléchargez un fichier isolé ou assemblez vos conversions en archive ZIP."/></div>
      </section>
      <section className="border-y border-[#132432]/10 bg-[#e9e4da] px-5 py-16 lg:px-10 lg:py-20"><div className="mx-auto grid max-w-[1220px] gap-10 md:grid-cols-[0.8fr_1.2fr]"><p className="label">COMPATIBILITÉ / TRANSPARENCE</p><div><h2 className="font-display max-w-2xl text-4xl font-bold leading-[0.98] tracking-[-0.07em]">Les formats courants, sans compromis sur la clarté.</h2><p className="mt-5 max-w-xl text-[1.02rem] leading-7 text-[#41525d]">JPG, PNG, WebP, AVIF, HEIC, TIFF et SVG sont décodés localement aujourd’hui. Les fichiers RAW, PSD, PDF et autres formats spécialisés sont détectés ; leur pipeline WebAssembly est affiché de façon explicite lorsqu’il n’est pas disponible sur cet appareil.</p></div></div></section>
    </main>
  </SiteShell>;
}

function FileRow({ item, onOutput, onRemove, onDownload }: { item: ConversionItem; onOutput: (value: CoreOutputMime) => void; onRemove: () => void; onDownload: () => void }) {
  const ext = extensionOf(item.file.name).toUpperCase();
  const stateLabel: Record<Stage, string> = { queued: readyExtensions.has(extensionOf(item.file.name)) ? "EN ATTENTE" : "DÉCODEUR À VENIR", decoding: "DÉCODAGE", converting: "CONVERSION", done: "PRÊT", failed: "À REVOIR" };
  return <div className="grid grid-cols-[minmax(0,1fr)_120px_105px_40px] items-center gap-3 border-b border-[#132432]/8 px-4 py-3 last:border-b-0"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center bg-[#132432] text-[0.58rem] font-bold text-[#b7f840]">{ext.slice(0, 4)}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{item.file.name}</p><p className="mt-0.5 text-xs text-[#65727b]">{prettySize(item.file.size)}{item.result ? ` → ${prettySize(item.result.size)}` : ""}</p></div></div>{item.error && <p className="mt-1 max-w-md text-xs leading-4 text-[#a1442a]">{item.error}</p>}</div><select value={item.output} disabled={item.stage !== "queued" && item.stage !== "failed"} onChange={(event) => onOutput(event.target.value as CoreOutputMime)} className="border border-[#132432]/14 bg-white px-2 py-2 text-xs font-bold outline-none disabled:opacity-60">{coreOutputFormats.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}</select><span className={`flex items-center gap-1.5 text-[0.62rem] font-bold tracking-[0.08em] ${item.stage === "done" ? "text-[#5c7820]" : item.stage === "failed" ? "text-[#a1442a]" : "text-[#65727b]"}`}>{item.stage === "done" ? <Check className="h-3.5 w-3.5" /> : (item.stage === "decoding" || item.stage === "converting") ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}{stateLabel[item.stage]}</span>{item.stage === "done" ? <button onClick={onDownload} className="grid h-8 w-8 place-items-center text-[#132432] hover:bg-[#b7f840]" aria-label="Télécharger"><ArrowDownToLine className="h-4 w-4" /></button> : <button onClick={onRemove} className="grid h-8 w-8 place-items-center text-[#65727b] hover:bg-[#ede6dd] hover:text-[#132432]" aria-label="Supprimer"><X className="h-4 w-4" /></button>}</div>;
}

function StatCard({ count, title, description }: { count: string; title: string; description: string }) { return <div className="border-l-2 border-[#b7f840] bg-[#f7f4ee] p-5"><p className="text-[0.66rem] font-bold tracking-[0.14em] text-[#5c7820]">{count}</p><h3 className="font-display mt-2 text-lg font-bold tracking-[-0.04em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#52616a]">{description}</p></div>; }

function outputName(item: ConversionItem) { const format = coreOutputFormats.find((format) => format.value === item.output)!; return `${item.file.name.replace(/\.[^.]+$/, "")}.${format.ext}`; }
