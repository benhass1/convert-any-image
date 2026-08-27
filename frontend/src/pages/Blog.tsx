/** Signal Utility design reminder: editorial guides are technical field notes with measured typography, visible tool routes and honest visual fallbacks. */
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Seo from "@/components/Seo";
import { articleBySlug, articles, BlogArticle as Article } from "@/lib/blog-data";

const categoryOrder = ["FORMAT FIXERS", "SIZE & COMPRESSION", "PRIVACY & SECURITY", "EMERGING FORMATS"];
const categoryTone = (index: number) => index % 3 === 1 ? "bg-[#132432] text-[#f4f0e8]" : "bg-[#f7f4ee] text-[#132432]";
const articleSchema = (article: Article) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: article.title,
  description: article.description,
  author: { "@type": "Organization", name: "Convert Any Image" },
  datePublished: "2026-08-27",
  dateModified: "2026-08-27",
  mainEntityOfPage: `https://convertanyimage.com/blog/${article.slug}`,
  keywords: article.keyword,
});

function ToolCta({ compact = false, compress = false }: { compact?: boolean; compress?: boolean }) {
  const href = compress ? "/compress#compress-upload" : "/#converter-upload";
  const label = compress ? "Open the free image compressor" : "Open the free image converter";
  return <aside className={`border ${compact ? "my-9 p-5" : "mt-12 p-7"} border-[#132432]/15 bg-[#e8f4cc]`}>
    <div className="flex gap-3">
      <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#5c7820]"/>
      <div>
        <p className="label text-[#5c7820]">LOCAL TOOL</p>
        <h3 className="font-display mt-2 text-2xl font-bold tracking-[-.05em]">Keep the file on your device.</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#41525d]">Use the available browser tool to process supported images locally, review the result, then download a separate copy.</p>
        <a href={href} className="mt-4 inline-flex items-center gap-2 bg-[#132432] px-4 py-3 text-sm font-bold text-[#f4f0e8] transition-transform hover:-translate-y-0.5">{label}<ArrowUpRight className="h-4 w-4"/></a>
      </div>
    </div>
  </aside>;
}

function GuideCardVisual({ article }: { article: Article }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [article.visual?.src]);
  if (article.visual && !failed) return <img src={article.visual.src} alt={article.visual.alt} loading="lazy" decoding="async" width="1200" height="800" onError={() => setFailed(true)} className="aspect-[16/9] w-full object-cover"/>;
  return <div className="grid aspect-[16/9] place-items-center border-y border-current/10 bg-[linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(currentColor_1px,transparent_1px)] bg-[size:20px_20px] opacity-70">
    <span className="border border-current/45 bg-[#f7f4ee]/85 px-3 py-2 text-[.58rem] font-bold tracking-[.14em] text-[#41525d]">EDITORIAL VISUAL IN DEVELOPMENT</span>
  </div>;
}

function GuideCard({ article, index }: { article: Article; index: number }) {
  const dark = index % 3 === 1;
  return <article className={`group relative overflow-hidden border border-[#132432]/12 ${categoryTone(index)}`}>
    <span className={`absolute right-0 top-0 z-10 grid h-9 w-9 place-items-center border-b border-l text-[.58rem] font-bold ${dark ? "border-[#f4f0e8]/22 bg-[#132432]/85 text-[#b7f840]" : "border-[#132432]/15 bg-[#f7f4ee]/85 text-[#5c7820]"}`}>{`${index + 1}`.padStart(2, "0")}</span>
    <GuideCardVisual article={article}/>
    <div className="p-6">
      <p className={`label ${dark ? "text-[#b7f840]" : "text-[#52616a]"}`}>{article.category}</p>
      <h3 className="font-display mt-5 pr-6 text-2xl font-bold leading-[1.02] tracking-[-.055em]">{article.title}</h3>
      <p className={`mt-4 text-sm leading-6 ${dark ? "text-[#d8d2c5]/75" : "text-[#52616a]"}`}>{article.lead}</p>
      <div className="mt-8 flex items-center justify-between border-t border-current/10 pt-4">
        <span className={`flex items-center gap-2 text-xs font-bold ${dark ? "text-[#d8d2c5]/65" : "text-[#65727b]"}`}><Clock3 className="h-3.5 w-3.5"/>{article.reading}</span>
        <Link href={`/blog/${article.slug}`} className={`grid h-9 w-9 place-items-center border transition-transform group-hover:translate-x-1 ${dark ? "border-[#f4f0e8]/30 text-[#b7f840]" : "border-[#132432]/15 text-[#132432]"}`} aria-label={`Read ${article.title}`}><ArrowUpRight className="h-4 w-4"/></Link>
      </div>
    </div>
  </article>;
}

export function BlogIndex() {
  const grouped = categoryOrder.map((category) => ({ category, entries: articles.filter((article) => article.category === category) })).filter((group) => group.entries.length);
  return <SiteShell><Seo exactTitle title="Image Conversion & Compression Guides" description="Practical guides for converting image formats, reducing file size and keeping supported image processing private on your device." keywords="image conversion guides, image compression guides, PSD to JPG, HEIC to JPG, RAW to JPG, reduce image size"/><main>
    <section className="bg-[#132432] px-5 py-8 text-[#f4f0e8] lg:px-10 lg:py-10"><div className="mx-auto grid max-w-[1220px] gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><aside className="border-l border-[#b7f840] pl-4"><p className="label text-[#b7f840]">PRACTICAL GUIDES</p><p className="mt-3 text-[.63rem] font-bold tracking-[.16em] text-[#d8d2c5]/55">INDEX / {articles.length.toString().padStart(2, "0")} NOTES</p><div className="mt-3 grid h-8 w-8 place-items-center border border-[#b7f840] text-[.58rem] font-bold text-[#b7f840]">HOW</div></aside><div><h1 className="font-display text-4xl font-bold leading-[.94] tracking-[-.075em] sm:text-5xl lg:text-6xl">Fix the format.<br/>Keep control of the file.</h1><p className="mt-3 max-w-xl text-base leading-6 text-[#d8d2c5]/74">Step-by-step notes for format problems, browser-safe conversion choices and image-size decisions that make sense for the destination.</p></div></div></section>
    <section className="mx-auto max-w-[1220px] px-5 py-7 lg:px-10 lg:py-9">{grouped.map((group) => <section key={group.category} className="mb-12 last:mb-0"><div className="mb-4 flex items-end justify-between gap-5 border-b border-[#132432]/12 pb-4"><div><p className="label">TOPIC CLUSTER</p><h2 className="font-display mt-2 text-3xl font-bold tracking-[-.06em]">{group.category}</h2></div><span className="text-[.65rem] font-bold tracking-[.14em] text-[#65727b]">{group.entries.length.toString().padStart(2, "0")} GUIDES</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.entries.map((article, index) => <GuideCard key={article.slug} article={article} index={index}/>)}</div></section>)}</section>
  </main></SiteShell>;
}

export function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const article = articleBySlug(params?.slug);
  if (!article) return <BlogIndex/>;
  const related = article.related.map((slug) => articleBySlug(slug)).filter((entry): entry is Article => Boolean(entry));
  const isCompress = article.tool === "compress";
  return <SiteShell><Seo exactTitle title={article.metaTitle} description={article.description} keywords={article.keyword} jsonLd={articleSchema(article)}/><main><article className="mx-auto max-w-[1040px] px-5 py-14 lg:py-20">
    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#52616a] hover:text-[#132432]"><ArrowLeft className="h-4 w-4"/>All guides</Link>
    <div className="mt-14 grid gap-8 lg:grid-cols-[185px_minmax(0,1fr)]"><aside className="h-fit border-l-2 border-[#b7f840] bg-[#132432] p-5 text-[#f4f0e8] lg:sticky lg:top-28"><span className="grid h-9 w-9 place-items-center border border-[#b7f840] text-[.6rem] font-bold text-[#b7f840]">GUIDE</span><p className="label mt-6 text-[#b7f840]">{article.category}</p><p className="mt-3 flex items-center gap-2 text-sm text-[#d8d2c5]/72"><Clock3 className="h-4 w-4"/>{article.reading}</p><p className="mt-7 border-t border-[#f4f0e8]/15 pt-4 text-[.6rem] font-bold tracking-[.14em] text-[#d8d2c5]/48">LOCAL FIELD NOTE</p></aside><div className="relative"><span className="absolute -left-3 -top-3 h-6 w-6 border-l border-t border-[#b7f840]"/><p className="label text-[#5c7820]">{article.keyword}</p><h1 className="font-display mt-3 text-5xl font-bold leading-[.94] tracking-[-.075em] lg:text-7xl">{article.title}</h1><p className="mt-7 max-w-3xl font-serif text-2xl leading-9 text-[#41525d]">{article.lead} Use the <a href="/#converter-upload" className="font-semibold text-[#132432] underline decoration-[#b7f840] underline-offset-4">free online image converter</a> when a compatible local conversion path is available.</p><GuideFigure visual={article.visual} fallbackAlt={`${article.title} step-by-step visual guide`}/>{article.sections.map((section, index) => <section key={section.heading} className="mt-12"><h2 className="font-display text-3xl font-bold leading-[.98] tracking-[-.06em]">{section.heading}</h2><div className="mt-5 space-y-5 font-serif text-lg leading-8 text-[#314753]">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.bullets && <ul className="mt-6 space-y-3 border-l-2 border-[#b7f840] pl-5 text-sm leading-6 text-[#41525d]">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{index === 0 && <ToolCta compact compress={isCompress}/>}</section>)}<p className="mt-10 text-lg leading-8 text-[#314753]">When the next step is about image size, use the <a href="/compress#compress-upload" className="font-semibold text-[#132432] underline decoration-[#b7f840] underline-offset-4">image compressor with adjustable quality and dimensions</a> and review the before-and-after size before downloading.</p><ToolCta compress={isCompress}/>{related.length > 0 && <section className="mt-14 border-t border-[#132432]/12 pt-9"><p className="label">RELATED GUIDES</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{related.map((entry) => <Link key={entry.slug} href={`/blog/${entry.slug}`} className="group border border-[#132432]/12 bg-[#f7f4ee] p-5 transition-colors hover:bg-[#e8f4cc]"><p className="label text-[#5c7820]">{entry.category}</p><h3 className="font-display mt-3 text-xl font-bold tracking-[-.04em]">{entry.title}</h3><span className="mt-5 flex items-center gap-2 text-sm font-bold">Read guide <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></Link>)}</div></section>}</div></div>
  </article></main></SiteShell>;
}

function GuideFigure({ visual, fallbackAlt }: { visual?: Article["visual"]; fallbackAlt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [visual?.src]);
  if (visual && !failed) return <figure className="mt-12 overflow-hidden border border-[#132432]/12 bg-[#e9e4da]"><img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" width="1200" height="800" onError={() => setFailed(true)} className="aspect-[3/2] w-full object-cover"/><figcaption className="border-t border-[#132432]/10 bg-[#f7f4ee] px-5 py-3 text-xs leading-5 text-[#65727b]">{visual.caption}</figcaption></figure>;
  return <figure className="mt-12 overflow-hidden border border-[#132432]/12 bg-[#e9e4da] p-6"><div className="grid min-h-48 place-items-center border border-dashed border-[#132432]/25 bg-[linear-gradient(90deg,rgba(19,36,50,.08)_1px,transparent_1px),linear-gradient(rgba(19,36,50,.08)_1px,transparent_1px)] bg-[size:20px_20px]"><div className="max-w-sm text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#132432] text-xs font-bold tracking-[.1em] text-[#b7f840]">HOW</span><p className="mt-4 text-sm font-semibold text-[#41525d]">{fallbackAlt}</p></div></div><figcaption className="mt-3 text-xs leading-5 text-[#65727b]">Follow the steps with your own file, then inspect the completed copy before using it.</figcaption></figure>;
}
