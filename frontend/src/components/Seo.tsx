/** Signal Utility design reminder: metadata is factual, clear and privacy-forward. */
import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export default function Seo({ title, description, exactTitle = false, keywords, jsonLd }: { title: string; description: string; exactTitle?: boolean; keywords?: string; jsonLd?: JsonLd }) {
  useEffect(() => {
    const resolvedTitle = exactTitle ? title : `${title} — Convert Any Image`;
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    document.title = resolvedTitle;
    let descriptionNode = document.querySelector('meta[name="description"]');
    if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.setAttribute("name", "description"); document.head.appendChild(descriptionNode); }
    descriptionNode.setAttribute("content", description);
    if (keywords) { let keywordsNode = document.querySelector('meta[name="keywords"]'); if (!keywordsNode) { keywordsNode = document.createElement("meta"); keywordsNode.setAttribute("name", "keywords"); document.head.appendChild(keywordsNode); } keywordsNode.setAttribute("content", keywords); }
    const setMeta = (selector: string, attribute: "name" | "property", content: string) => { let node = document.querySelector<HTMLMetaElement>(selector); if (!node) { node = document.createElement("meta"); node.setAttribute(attribute, selector.match(/['"]([^'"]+)/)?.[1] ?? ""); document.head.appendChild(node); } node.content = content; };
    setMeta('meta[property="og:title"]', "property", resolvedTitle); setMeta('meta[property="og:description"]', "property", description); setMeta('meta[property="og:url"]', "property", canonicalUrl); setMeta('meta[name="twitter:title"]', "name", resolvedTitle); setMeta('meta[name="twitter:description"]', "name", description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); } canonical.href = canonicalUrl;
    const scriptId = "page-jsonld"; document.getElementById(scriptId)?.remove();
    if (jsonLd) { const script = document.createElement("script"); script.id = scriptId; script.type = "application/ld+json"; script.textContent = JSON.stringify(jsonLd); document.head.appendChild(script); }
    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, exactTitle, keywords, jsonLd]);
  return null;
}
