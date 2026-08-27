/**
 * Signal Utility behavior: direct tool visits open at the active upload console,
 * with the fixed navigation kept clear above the target.
 */
import { useLayoutEffect } from "react";

export function useDefaultWorkbench(targetId: string) {
  useLayoutEffect(() => {
    if (window.location.hash) return;

    let frame = 0;
    let attempts = 0;
    const positionWorkbench = () => {
      const target = document.getElementById(targetId);
      if (!target) {
        if (attempts < 8) {
          attempts += 1;
          frame = window.requestAnimationFrame(positionWorkbench);
        }
        return;
      }

      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 92);
      window.scrollTo({ top, left: 0, behavior: "auto" });
    };

    positionWorkbench();
    return () => window.cancelAnimationFrame(frame);
  }, [targetId]);
}
