/** Signal Utility design reminder: metadata is factual, clear and privacy-forward. */
import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export default function Seo({ title, description, exactTitle = false, keywords, jsonLd }: { title: string; description: string; exactTitle?: boolean; keywords?: string; jsonLd?: JsonLd }) {
  useEffect(() => {
    document.title = exactTitle ? title : `${title} — Convert Any Image`;
    let descriptionNode = document.querySelector('meta[name="description"]');
    if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.setAttribute("name", "description"); document.head.appendChild(descriptionNode); }
    descriptionNode.setAttribute("content", description);
    if (keywords) { let keywordsNode = document.querySelector('meta[name="keywords"]'); if (!keywordsNode) { keywordsNode = document.createElement("meta"); keywordsNode.setAttribute("name", "keywords"); document.head.appendChild(keywordsNode); } keywordsNode.setAttribute("content", keywords); }
    const scriptId = "page-jsonld"; document.getElementById(scriptId)?.remove();
    if (jsonLd) { const script = document.createElement("script"); script.id = scriptId; script.type = "application/ld+json"; script.textContent = JSON.stringify(jsonLd); document.head.appendChild(script); }
    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, exactTitle, keywords, jsonLd]);
  return null;
}
