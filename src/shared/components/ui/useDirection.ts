import { useState, useEffect } from "react";

// Reads `<html dir="...">` and re-renders when it changes, via a
// MutationObserver. This app sets `document.documentElement.dir` directly
// off the active language (see `src/i18n/index.ts`'s `syncDocumentLocale`),
// so this is a drop-in — nothing else to wire up.

export interface DirectionState {
  dir: "rtl" | "ltr";
  isRtl: boolean;
}

const readDir = (): "rtl" | "ltr" =>
  typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr";

export const useDirection = (): DirectionState => {
  const [dir, setDir] = useState<"rtl" | "ltr">(readDir);

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDir(readDir()));
    observer.observe(el, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  return { dir, isRtl: dir === "rtl" };
};
