/** Signal Utility design reminder: metadata is factual, clear and privacy-forward. */
import { useEffect } from "react";

export default function Seo({ title, description, exactTitle = false, keywords }: { title: string; description: string; exactTitle?: boolean; keywords?: string }) {
  useEffect(() => {
    document.title = exactTitle ? title : `${title} — Convert Any Image`;
    let descriptionNode = document.querySelector('meta[name="description"]');
    if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.setAttribute("name", "description"); document.head.appendChild(descriptionNode); }
    descriptionNode.setAttribute("content", description);
    if (keywords) { let keywordsNode = document.querySelector('meta[name="keywords"]'); if (!keywordsNode) { keywordsNode = document.createElement("meta"); keywordsNode.setAttribute("name", "keywords"); document.head.appendChild(keywordsNode); } keywordsNode.setAttribute("content", keywords); }
  }, [title, description, exactTitle, keywords]);
  return null;
}
