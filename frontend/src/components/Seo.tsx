/** Signal Utility design reminder: metadata is factual, clear and privacy-forward. */
import { useEffect } from "react";

export default function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — Convert Any Image`;
    let descriptionNode = document.querySelector('meta[name="description"]');
    if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.setAttribute("name", "description"); document.head.appendChild(descriptionNode); }
    descriptionNode.setAttribute("content", description);
  }, [title, description]);
  return null;
}
