import { useState, useRef, useLayoutEffect } from "react";

type NaturalSize = { width: number; height: number };

/**
 * Tracks an element's untransformed layout size via ResizeObserver — safe to
 * call on an element that itself carries a CSS `transform: scale()`, since
 * ResizeObserver (unlike `getBoundingClientRect`) reports the pre-transform
 * content box. Callers use this to reserve the correctly scaled footprint in
 * a non-transformed ancestor, so a scaled-down element actually shrinks the
 * scrollable area instead of just shrinking visually.
 */
export const useContentNaturalSize = <T extends HTMLElement>() => {
  const [naturalSize, setNaturalSize] = useState<NaturalSize>({ width: 0, height: 0 });
  const contentRef = useRef<T>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setNaturalSize({ width: el.offsetWidth, height: el.offsetHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { contentRef, naturalSize };
};
