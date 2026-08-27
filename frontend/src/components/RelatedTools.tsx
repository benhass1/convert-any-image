/** Signal Utility design reminder: related tools are visible, practical navigation—not a keyword list. */
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export type ToolId = "convert" | "compress" | "exif" | "heic" | "webp";

const toolLinks: Record<ToolId, Array<{ href: string; label: string; title?: string; copy: string }>> = {
  convert: [
    { href: "/heic-to-jpg", label: "convert HEIC to JPG free no watermark", title: "Convert HEIC to JPG free no watermark", copy: "Use the format guide when an iPhone image needs a practical JPG copy." },
    { href: "/webp-to-png", label: "convert WebP to PNG with existing transparency", title: "Convert WebP to PNG while preserving existing transparency", copy: "Create a PNG delivery copy and inspect any existing transparent areas." },
    { href: "/compress", label: "compress images for Discord with quality controls", title: "Compress images for Discord with quality controls", copy: "Adjust image size and visual quality before sharing the final copy." },
  ],
  compress: [
    { href: "/#converter-upload", label: "Open the free online image converter", copy: "Choose a compatible output format before preparing a smaller delivery copy." },
    { href: "/heic-to-jpg", label: "Convert a HEIC photo to JPG", copy: "Make a JPG first when the receiving workflow cannot use HEIC." },
    { href: "/webp-to-png", label: "Prepare a WebP image as PNG", copy: "Use PNG only when the receiving workflow benefits from that output format." },
  ],
  exif: [
    { href: "/#converter-upload", label: "Convert a supported image", copy: "Create a compatible image copy for a different destination." },
    { href: "/compress#compress-upload", label: "Compress a sharing copy", copy: "Review the before-and-after file size before you download." },
    { href: "/blog/remove-exif-data-from-photos", label: "Read the EXIF removal guide", copy: "Understand the source metadata that a fresh browser export does not carry forward." },
  ],
  heic: [
    { href: "/#converter-upload", label: "Open the image converter", copy: "Add a compatible HEIC file and choose JPG as the output." },
    { href: "/compress#compress-upload", label: "Compress the new JPG after conversion", copy: "Make a smaller delivery copy only after you inspect the JPG." },
    { href: "/webp-to-png", label: "Convert WebP to PNG", copy: "Use the companion format guide for WebP assets and existing transparency." },
  ],
  webp: [
    { href: "/#converter-upload", label: "Open the image converter", copy: "Choose PNG for a compatible delivery copy from a supported WebP file." },
    { href: "/compress#compress-upload", label: "Compress a PNG delivery copy", copy: "Inspect the final file before using it where image weight matters." },
    { href: "/heic-to-jpg", label: "Convert a HEIC photo to JPG", copy: "Use the HEIC guide when an iPhone photo needs a conventional JPG copy." },
  ],
};

export default function RelatedTools({ current }: { current: ToolId }) {
  return <section className="border-t border-[#132432]/10 bg-[#e9e4da] px-5 py-14 lg:px-10 lg:py-18"><div className="mx-auto max-w-[1220px]"><p className="label text-[#5c7820]">RELATED TOOLS</p><h2 className="font-display mt-2 max-w-2xl text-4xl font-bold leading-[.98] tracking-[-.07em]">Continue with the right image task</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#41525d]">Each workflow creates a separate output copy. Choose the next step based on the file format, destination and privacy checks you need.</p><div className="mt-8 grid gap-px overflow-hidden border border-[#132432]/12 bg-[#132432]/12 md:grid-cols-3">{toolLinks[current].map((tool, index) => <Link key={tool.href} href={tool.href} title={tool.title ?? tool.label} className="group bg-[#f7f4ee] p-5 transition-colors hover:bg-[#e8f4cc]"><span aria-hidden="true" className="grid h-8 w-8 place-items-center border border-[#132432]/20 bg-[#132432] text-[.6rem] font-bold tracking-[.08em] text-[#b7f840]">0{index + 1}</span><h3 className="font-display mt-5 flex items-start justify-between gap-4 text-xl font-bold leading-tight tracking-[-.045em]">{tool.label}<ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#5c7820] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></h3><p className="mt-3 text-sm leading-6 text-[#52616a]">{tool.copy}</p></Link>)}</div></div></section>;
}
