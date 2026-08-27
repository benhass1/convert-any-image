/** Signal Utility design reminder: format pages give an honest route into the shared local converter with no implied universal support. */
import { ArrowRight, Check } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import RelatedTools, { type ToolId } from "@/components/RelatedTools";

type Variant = "heic" | "webp";
type FormatPageConfig = { toolId: ToolId; path: string; title: string; description: string; keyword: string; label: string; heading: string; intro: string; steps: string[]; sections: Array<{ heading: string; paragraphs: string[] }>; faqs: Array<{ question: string; answer: string }> };

const configurations: Record<Variant, FormatPageConfig> = {
  heic: {
    toolId: "heic", path: "/heic-to-jpg", title: "Convert HEIC to JPG – Local Browser Tool", description: "Create a JPG copy from a supported HEIC image in your browser, then inspect and download the result without a standard upload step.", keyword: "convert HEIC to JPG on Windows 11, HEIC to JPG browser converter", label: "HEIC / JPG WORKFLOW", heading: "Convert HEIC to JPG on Windows 11", intro: "Use the shared converter to create a separately named JPG copy when a Windows app, attachment field or sharing workflow cannot use a HEIC photo.",
    steps: ["Add a compatible HEIC or HEIF image to the conversion workbench.", "Choose JPG as the output and create a separate copy.", "Open the JPG and check orientation, colour and file size before sharing it."],
    sections: [
      { heading: "When a JPG copy is useful", paragraphs: ["HEIC can keep camera photos compact, but a particular application, device or recipient may expect JPG instead. Converting one delivery copy lets you retain the source photo while preparing a broadly usable version.", "The result depends on the individual file and browser decoder. If the HEIC file cannot be read, the converter reports that limitation rather than pretending a conversion succeeded."] },
      { heading: "Keep the conversion practical", paragraphs: ["JPG uses lossy compression, so start with the original HEIC whenever you need another output. Avoid repeatedly converting an already converted JPG.", "If the new JPG is too large for its destination, make a separate compressed copy after reviewing the converted image. Compression settings trade file weight against visible detail."] },
      { heading: "Use a checked delivery copy", paragraphs: ["Open the finished JPG before attaching it to an application or message. This is particularly helpful for images that matter for orientation, fine text, colour or crop.", "The original stays on your device. Keep it separately from any formatted delivery copies you create for a specific recipient or workflow."] },
    ],
    faqs: [
      { question: "Can every browser convert HEIC to JPG?", answer: "No. HEIC decoding depends on the browser, device and individual file. The tool reports when a compatible local decoding path is unavailable." },
      { question: "Does converting HEIC to JPG change my source photo?", answer: "No. The converter prepares a separate JPG download; it does not edit or replace the original HEIC file." },
      { question: "Can I make a smaller JPG after converting it?", answer: "Yes. Inspect the converted JPG first, then use the image compressor to make a separate delivery copy with settings you can review." },
    ],
  },
  webp: {
    toolId: "webp", path: "/webp-to-png", title: "WebP to PNG Converter – Local Browser Tool", description: "Create a PNG copy from a supported WebP image in your browser and inspect existing transparency before using it in a Shopify or design workflow.", keyword: "convert WebP to PNG, WebP to PNG existing transparent background", label: "WEBP / PNG WORKFLOW", heading: "WebP to PNG for Shopify workflows and existing transparent backgrounds", intro: "Use the shared converter when a store workflow, supplier or designer needs a PNG copy of a supported WebP image for review or upload.",
    steps: ["Add a supported WebP file to the conversion workbench.", "Choose PNG as the output and create a separate copy.", "Review the PNG on a coloured background when existing transparency matters."],
    sections: [
      { heading: "Choose PNG for a real workflow need", paragraphs: ["PNG can be a useful delivery format when a receiving workflow specifically requests it, when a graphic needs clean edges, or when the source already contains transparent areas. Keep the WebP source in case you need a different output later.", "Store platforms, themes and applications can have different asset requirements. Check the actual destination before converting a large set of product images."] },
      { heading: "How to convert WebP to PNG for Shopify workflows with existing transparency", paragraphs: ["Open the image converter, select the WebP file and choose PNG. The downloaded file is a new PNG copy that you can inspect before putting it into a product-image workflow.", "A compatible conversion can preserve existing transparent pixels, but it does not remove an opaque background or create a cutout. Review the PNG against a contrasting background to confirm what the source contained."] },
      { heading: "Prepare an intentional delivery image", paragraphs: ["Review the new PNG at the dimensions where it will appear. If its file weight needs attention, create another reviewed delivery copy with the compressor rather than replacing the source asset.", "Use a different format when the destination calls for it. JPG, for example, cannot preserve transparent areas."] },
    ],
    faqs: [
      { question: "Does WebP-to-PNG conversion make an opaque background transparent?", answer: "No. The conversion can preserve transparency that already exists in a compatible source, but it does not remove or cut out an opaque background." },
      { question: "Can I use this for Shopify product-image preparation?", answer: "You can create a PNG delivery copy for a store workflow, but you should check the current requirements of the particular store, theme or app before uploading." },
      { question: "Is the WebP source changed?", answer: "No. The tool prepares a separate PNG download and leaves the original source file on your device." },
    ],
  },
};

export default function FormatToolPage({ variant }: { variant: Variant }) {
  const page = configurations[variant];
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "SoftwareApplication", "@id": `https://convertanyimage.com${page.path}#app`, name: page.heading, applicationCategory: "MultimediaApplication", operatingSystem: "Any", url: `https://convertanyimage.com${page.path}`, provider: { "@id": "https://convertanyimage.com/#organization" }, description: page.description, featureList: ["Local browser processing for supported files", "Separate output copies", "No account required", "Watermark-free output"], isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    { "@type": "FAQPage", "@id": `https://convertanyimage.com${page.path}#faq`, mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    { "@type": "WebPage", "@id": `https://convertanyimage.com${page.path}#webpage`, url: `https://convertanyimage.com${page.path}`, name: page.title, author: { "@id": "https://convertanyimage.com/#organization" }, publisher: { "@id": "https://convertanyimage.com/#organization" }, datePublished: "2026-08-27T00:00:00+02:00", dateModified: "2026-08-27T00:00:00+02:00" },
  ] };
  return <SiteShell><Seo exactTitle title={page.title} description={page.description} keywords={page.keyword} jsonLd={jsonLd}/><main>
    <section className="border-b border-[#132432]/10 bg-[#132432] px-5 py-16 text-[#f4f0e8] lg:px-10 lg:py-24"><div className="mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div><p className="label text-[#b7f840]">{page.label}</p><h1 className="font-display mt-4 max-w-4xl text-4xl font-bold leading-[.93] tracking-[-.075em] sm:text-5xl lg:text-7xl">{page.heading}</h1><p className="mt-6 max-w-2xl text-lg leading-7 text-[#d8d2c5]/82">{page.intro}</p><a href="/#converter-upload" className="action-primary mt-8 inline-flex">Open the conversion workbench <ArrowRight className="h-4 w-4"/></a></div><aside className="border border-[#b7f840]/35 bg-[#19313f] p-6"><p className="label text-[#b7f840]">THREE CHECKED STEPS</p><ol className="mt-5 space-y-5">{page.steps.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-6 text-[#d8d2c5]"><span className="grid h-7 w-7 shrink-0 place-items-center border border-[#b7f840]/50 text-xs font-bold text-[#b7f840]">0{index + 1}</span><span>{step}</span></li>)}</ol></aside></div></section>
    <section className="bg-[#f7f4ee] px-5 py-16 lg:px-10 lg:py-24"><div className="mx-auto max-w-[900px] space-y-14">{page.sections.map((section) => <section key={section.heading}><h2 className="font-display max-w-3xl text-3xl font-bold leading-[.98] tracking-[-.065em] sm:text-4xl">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 font-serif text-lg leading-8 text-[#41525d]">{paragraph}</p>)}</section>)}</div></section>
    <section className="border-t border-[#132432]/10 bg-[#fffdf8] px-5 py-16 lg:px-10 lg:py-20"><div className="mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[.72fr_1.28fr]"><div><p className="label text-[#5c7820]">HELP / FAQ</p><h2 className="font-display mt-3 text-4xl font-bold leading-[.96] tracking-[-.07em]">Format conversion answers</h2><p className="mt-5 max-w-sm leading-7 text-[#52616a]">Use the original source, review the new output and keep it as a separate delivery copy.</p></div><div className="divide-y divide-[#132432]/10 border-y border-[#132432]/10">{page.faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-display text-lg font-bold tracking-[-.03em] marker:hidden">{faq.question}<span className="float-right text-[#5c7820] transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-[#52616a]">{faq.answer}</p></details>)}</div></div></section>
    <RelatedTools current={page.toolId}/>
  </main></SiteShell>;
}
