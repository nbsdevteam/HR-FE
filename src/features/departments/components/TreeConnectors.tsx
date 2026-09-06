import { useState, useRef, useCallback, useEffect } from "react";

const TreeConnectors = ({ parentRef, childRefs, color }: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  childRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  color: string;
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const parent = parentRef.current;
    if (!container || !parent) return;
    const cRect = container.getBoundingClientRect();
    const pRect = parent.getBoundingClientRect();
    // `cRect`/`pRect` are post-transform screen pixels (they reflect the
    // ancestor's `scale(zoom)` from StructureCardsView), but this SVG has no
    // `viewBox` so its own path coordinates are interpreted in pre-transform
    // (unscaled) pixels — it gets scaled again by that same ancestor when it
    // paints. Dividing out the container's rendered/layout ratio here undoes
    // the first scale so the two don't compound and drift apart at zoom != 1.
    const scale = container.offsetWidth ? cRect.width / container.offsetWidth : 1;
    const px = (pRect.left + pRect.width / 2 - cRect.left) / scale;
    const py = (pRect.bottom - cRect.top) / scale;
    const radius = 8, stemLen = 20;
    const jY = py + stemLen;
    const newPaths: string[] = [];

    childRefs.current.forEach((el) => {
      if (!el) return;
      const cr = el.getBoundingClientRect();
      const cx = (cr.left + cr.width / 2 - cRect.left) / scale;
      const cy = (cr.top - cRect.top) / scale;
      const dx = cx - px;
      if (Math.abs(dx) < 2) {
        newPaths.push(`M ${px} ${py} L ${px} ${cy}`);
      } else {
        const dir = dx > 0 ? 1 : -1;
        const r = Math.min(radius, Math.abs(dx), stemLen, cy - jY);
        newPaths.push(`M ${px} ${py} L ${px} ${jY - r} Q ${px} ${jY} ${px + dir * r} ${jY} L ${cx - dir * r} ${jY} Q ${cx} ${jY} ${cx} ${jY + r} L ${cx} ${cy}`);
      }
    });
    setPaths(newPaths);
  }, [parentRef, childRefs]);

  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    const c = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (c) { ro = new ResizeObserver(() => requestAnimationFrame(measure)); ro.observe(c); }

    // The chart is zoomed via a CSS `transform: scale()` transition on an
    // ancestor (see StructureCardsView) — `getBoundingClientRect` reflects that
    // scale, but a pure transform never changes any element's layout size, so
    // the ResizeObserver above never fires for it and these lines go stale the
    // moment zoom changes. `transitionend` bubbles up from wherever the
    // transform actually animates, so a document-level listener catches it
    // regardless of how deep this connector is nested.
    const handleTransitionEnd = (event: TransitionEvent): void => {
      if (event.propertyName === "transform") requestAnimationFrame(measure);
    };
    document.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      document.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [measure]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.35} />
            <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.06} />
          </g>
        ))}
      </svg>
    </div>
  );

};

export default TreeConnectors;
