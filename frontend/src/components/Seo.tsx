/** Signal Utility design reminder: metadata is factual, clear and privacy-forward. */
import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

const site = "https://convertanyimage.com";
const languageAlternates = [
  ["x-default", "/"], ["en", "/"], ["fr", "/fr/"], ["it", "/it/"],
  ["ja", "/ja/"], ["pl", "/pl/"], ["nl", "/nl/"], ["de", "/de/"],
  ["es", "/es/"], ["ko", "/ko/"], ["ru", "/ru/"], ["pt", "/pt/"],
] as const;

export default function Seo({ title, description, exactTitle = false, keywords, jsonLd }: { title: string; description: string; exactTitle?: boolean; keywords?: string; jsonLd?: JsonLd }) {
  useEffect(() => {
    const resolvedTitle = exactTitle ? title : `${title} — Convert Any Image`;
    const localizedPath = /^\/(fr|it|ja|pl|nl|de|es|ko|ru|pt)\/$/.test(window.location.pathname);
    const canonicalPath = localizedPath ? window.location.pathname : (window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/$/, ""));
    const canonicalUrl = `${site}${canonicalPath}`;
    document.title = resolvedTitle;
    let descriptionNode = document.querySelector('meta[name="description"]');
    if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.setAttribute("name", "description"); document.head.appendChild(descriptionNode); }
    descriptionNode.setAttribute("content", description);
    if (keywords) { let keywordsNode = document.querySelector('meta[name="keywords"]'); if (!keywordsNode) { keywordsNode = document.createElement("meta"); keywordsNode.setAttribute("name", "keywords"); document.head.appendChild(keywordsNode); } keywordsNode.setAttribute("content", keywords); }
    const setMeta = (selector: string, attribute: "name" | "property", content: string) => { let node = document.querySelector<HTMLMetaElement>(selector); if (!node) { node = document.createElement("meta"); node.setAttribute(attribute, selector.match(/['"]([^'"]+)/)?.[1] ?? ""); document.head.appendChild(node); } node.content = content; };
    setMeta('meta[property="og:title"]', "property", resolvedTitle); setMeta('meta[property="og:description"]', "property", description); setMeta('meta[property="og:url"]', "property", canonicalUrl); setMeta('meta[name="twitter:title"]', "name", resolvedTitle); setMeta('meta[name="twitter:description"]', "name", description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); } canonical.href = canonicalUrl;
    document.querySelectorAll('link[rel="alternate"][data-seo-hreflang]').forEach((node) => node.remove());
    for (const [hreflang, href] of languageAlternates) { const alternate = document.createElement("link"); alternate.rel = "alternate"; alternate.hreflang = hreflang; alternate.href = `${site}${href}`; alternate.setAttribute("data-seo-hreflang", "true"); document.head.appendChild(alternate); }
    const scriptId = "page-jsonld"; document.getElementById(scriptId)?.remove();
    if (jsonLd) { const script = document.createElement("script"); script.id = scriptId; script.type = "application/ld+json"; script.textContent = JSON.stringify(jsonLd); document.head.appendChild(script); }
    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, exactTitle, keywords, jsonLd]);
  return null;
}
