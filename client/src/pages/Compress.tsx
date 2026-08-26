/**
 * Signal Utility design reminder: the compressor is a measurable instrument, not a vague promise.
 */
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ArrowDownToLine, Check, ChevronDown, FolderUp, ImageDown, LoaderCircle, LockKeyhole, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import { convertImage, downloadBlob, extensionOf, prettySize } from "@/lib/image-processing";

type Preset = "maximum" | "balanced" | "lossless";
type Item = { id: string; file: File; result?: Blob; status: "queued" | "working" | "done" | "failed"; error?: string };
const privacyImage = "/manus-storage/convert-any-image-privacy_8d7e1e2b.jpg";

const presetCopy: Record<Preset, { label: string; detail: string; quality: number }> = {
  maximum: { label: "Maximum", detail: "Poids minimum", quality: .58 }, balanced: { label: "Équilibré", detail: "Qualité / poids", quality: .82 }, lossless: { label: "Préserver", detail: "Compression douce", quality: .96 },
};

export default function Compress() {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(82);
  const [scale, setScale] = useState(100);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [lockRatio, setLockRatio] = useState(true);
  const [dragging, setDragging] = useState(false);

  const add = (files: FileList | File[]) => setItems((current) => [...current, ...Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)).map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const }))]);
  const update = (id: string, change: Partial<Item>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...change } : item));
  const selectPreset = (next: Preset) => { setPreset(next); setQuality(Math.round(presetCopy[next].quality * 100)); };
  const run = async () => {
    for (const item of items.filter((entry) => entry.status === "queued" || entry.status === "failed")) {
      update(item.id, { status: "working", error: undefined });
      try {
        let source = item.file;
        const extension = extensionOf(item.file.name);
        if (extension === "heic" || extension === "heif") {
          const decoded = await convertImage(item.file, "image/jpeg");
          source = new File([decoded], item.file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        }
        const { default: imageCompression } = await import("browser-image-compression");
        const result = await imageCompression(source, { useWebWorker: true, initialQuality: quality / 100, maxWidthOrHeight: Math.round(6000 * scale / 100), alwaysKeepResolution: scale === 100, fileType: source.type === "image/png" && preset === "lossless" ? "image/png" : "image/webp" });
        update(item.id, { status: "done", result });
      } catch (error) { update(item.id, { status: "failed", error: error instanceof Error ? error.message : "Compression interrompue." }); }
    }
  };
  const complete = items.filter((item) => item.status === "done").length;
  return <SiteShell><Seo title="Compresser des images" description="Réduisez le poids de vos JPG, PNG, WebP, AVIF et HEIC directement dans votre navigateur." />
    <main>
      <section className="border-b border-[#132432]/10 bg-[#f4f0e8] px-5 pb-12 pt-14 lg:px-10 lg:pb-16 lg:pt-20"><div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end"><div><p className="label flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#b7f840]" /> OPTIMISATION LOCALE</p><h1 className="font-display mt-4 max-w-3xl text-5xl font-bold leading-[.93] tracking-[-.075em] lg:text-7xl">Réduisez le poids,<br/><span>préservez l’intention.</span></h1><p className="mt-6 max-w-xl text-lg leading-7 text-[#41525d]">Réglez la qualité et la résolution, comparez les résultats, puis récupérez vos fichiers optimisés. Aucun envoi n’est nécessaire.</p></div><div className="relative min-h-[190px] overflow-hidden bg-[#132432]"><img src={privacyImage} alt="Illustration d’un traitement local et privé" className="absolute inset-0 h-full w-full object-cover opacity-80"/><div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(19,36,50,.84),rgba(19,36,50,.15))]"/><div className="absolute left-5 top-5 flex items-center gap-2 border border-[#b7f840]/55 px-2 py-1 text-[.6rem] font-bold tracking-[.14em] text-[#b7f840]"><span className="h-2 w-2 border border-[#b7f840]"/>LOCAL / ACTIF</div><p className="absolute bottom-5 left-5 max-w-[190px] text-sm font-semibold leading-5 text-[#f4f0e8]">Vos réglages et vos fichiers ne quittent pas cet onglet.</p></div></div></section>
      <section className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-12"><div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="h-fit border border-[#132432]/12 bg-[#132432] p-6 text-[#f4f0e8] lg:sticky lg:top-24"><div className="flex items-center gap-2 text-[#b7f840]"><SlidersHorizontal className="h-4 w-4"/><p className="label text-[#b7f840]">RÉGLAGES</p></div><div className="mt-7"><div className="mb-3 flex items-end justify-between"><label className="text-sm font-bold">Qualité visuelle</label><output className="font-display text-3xl font-bold tracking-[-.07em] text-[#b7f840]">{quality}<span className="text-base">%</span></output></div><input aria-label="Qualité" type="range" min="1" max="100" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); setPreset("balanced"); }} className="signal-range w-full"/><div className="mt-6 grid grid-cols-3 gap-2">{(Object.keys(presetCopy) as Preset[]).map((key) => <button key={key} onClick={() => selectPreset(key)} className={`border p-2.5 text-left ${preset === key ? "border-[#b7f840] bg-[#b7f840] text-[#132432]" : "border-[#f4f0e8]/18 text-[#d8d2c5]/76 hover:border-[#f4f0e8]/45"}`}><span className="block text-xs font-bold">{presetCopy[key].label}</span><span className="mt-1 block text-[.61rem] leading-3 opacity-72">{presetCopy[key].detail}</span></button>)}</div></div><div className="mt-8 border-t border-[#f4f0e8]/15 pt-7"><div className="mb-3 flex items-end justify-between"><label className="text-sm font-bold">Échelle</label><output className="font-display text-3xl font-bold tracking-[-.07em] text-[#b7f840]">{scale}<span className="text-base">%</span></output></div><input aria-label="Échelle" type="range" min="10" max="100" value={scale} onChange={(event) => setScale(Number(event.target.value))} className="signal-range w-full"/><button onClick={() => setLockRatio(!lockRatio)} className={`mt-4 flex w-full items-center justify-between border px-3 py-2.5 text-sm ${lockRatio ? "border-[#b7f840]/45 text-[#b7f840]" : "border-[#f4f0e8]/18 text-[#d8d2c5]/70"}`}><span>Proportions liées</span><span className="text-[.63rem] font-bold tracking-[.12em]">{lockRatio ? "ACTIF" : "LIBRE"}</span></button></div><div className="mt-8 border-t border-[#f4f0e8]/15 pt-6 text-sm leading-6 text-[#d8d2c5]/70"><LockKeyhole className="mb-2 h-4 w-4 text-[#b7f840]"/>Le calcul s’exécute localement. Fermer l’onglet supprime la session.</div></aside>
        <div><div onClick={() => input.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files); }} className={`group grid min-h-[260px] cursor-pointer place-items-center border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-[#5c7820] bg-[#e7f3c9]" : "border-[#132432]/14 bg-[#eee9de] hover:border-[#5c7820]"}`}><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#132432] text-[#b7f840]"><ImageDown className="h-6 w-6" /></div><p className="font-display text-2xl font-bold tracking-[-.055em]">Déposez vos images à optimiser</p><p className="mt-2 text-sm text-[#52616a]">JPG, PNG, WEBP, AVIF et HEIC</p></div><input ref={input} className="hidden" type="file" multiple accept="image/*,.heic,.heif" onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) add(event.target.files); event.target.value = ""; }}/></div>
          {items.length > 0 && <div className="mt-5 overflow-hidden border border-[#132432]/12 bg-white"><div className="grid grid-cols-[minmax(0,1fr)_120px_90px_40px] gap-3 border-b border-[#132432]/10 bg-[#eee9de] px-4 py-3 text-[.63rem] font-bold tracking-[.13em] text-[#65727b]"><span>IMAGE</span><span>GAIN</span><span>ÉTAT</span><span/></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_120px_90px_40px] items-center gap-3 border-b border-[#132432]/8 px-4 py-3 last:border-b-0"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.file.name}</p><p className="mt-1 text-xs text-[#65727b]">{prettySize(item.file.size)}{item.result && ` → ${prettySize(item.result.size)}`}{item.error && <span className="ml-1 text-[#a1442a]">{item.error}</span>}</p></div><div>{item.result ? <span className="text-sm font-bold text-[#5c7820]">−{Math.max(0, Math.round((1 - item.result.size / item.file.size) * 100))}%</span> : <span className="text-xs text-[#65727b]">—</span>}</div><span className={`flex items-center gap-1.5 text-[.62rem] font-bold tracking-[.08em] ${item.status === "done" ? "text-[#5c7820]" : item.status === "failed" ? "text-[#a1442a]" : "text-[#65727b]"}`}>{item.status === "done" ? <Check className="h-3.5 w-3.5"/> : item.status === "working" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <span className="h-1.5 w-1.5 rounded-full bg-current"/>}{item.status === "done" ? "PRÊT" : item.status === "working" ? "CALCUL" : item.status === "failed" ? "ERREUR" : "EN ATTENTE"}</span>{item.result ? <button onClick={() => downloadBlob(item.result!, `${item.file.name.replace(/\.[^.]+$/, "")}.webp`)} className="grid h-8 w-8 place-items-center hover:bg-[#b7f840]"><ArrowDownToLine className="h-4 w-4"/></button> : <button onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="grid h-8 w-8 place-items-center text-[#65727b] hover:bg-[#eee9de]"><X className="h-4 w-4"/></button>}</div>)}</div>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><button onClick={() => input.current?.click()} className="flex items-center gap-2 text-sm font-bold text-[#41525d]"><Plus className="h-4 w-4"/>Ajouter</button><div className="flex gap-3"><button disabled={!complete} onClick={() => items.filter((item) => item.result).forEach((item) => downloadBlob(item.result!, `${item.file.name.replace(/\.[^.]+$/, "")}.webp`))} className="action-secondary"><ArrowDownToLine className="h-4 w-4"/>Télécharger</button><button disabled={!items.length || items.some((item) => item.status === "working")} onClick={run} className="action-primary"><ChevronDown className="h-4 w-4"/>Optimiser</button></div></div>
        </div></div></section>
    </main>
  </SiteShell>;
}
