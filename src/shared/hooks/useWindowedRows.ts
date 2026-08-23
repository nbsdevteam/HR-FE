import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Row windowing for page-scrolled tables.
 *
 * The employee, attendance and device-log tables render every filtered row into
 * the DOM — fine at 50 rows, expensive at 2000. Off-the-shelf virtualizers
 * (react-window et al.) assume a fixed-height scroll container and replace the
 * table with absolutely-positioned divs, which breaks `<table>` column sizing
 * and the app's RTL layout. This computes the visible slice against the *page*
 * scroll instead, so the caller can keep real `<tr>`s and simply pad the top and
 * bottom with two spacer rows.
 */

export type WindowedRows = {
  /** Attach to the element wrapping the rows (the `<tbody>`). */
  containerRef: React.RefObject<HTMLTableSectionElement>;
  /** First row index to render (inclusive). */
  startIndex: number;
  /** Last row index to render (exclusive). */
  endIndex: number;
  /** Height in px of the spacer row above the rendered slice. */
  topPadding: number;
  /** Height in px of the spacer row below the rendered slice. */
  bottomPadding: number;
};

type Options = {
  /** Total number of rows in the (already filtered/sorted) list. */
  rowCount: number;
  /** Approximate rendered height of one row, in px. */
  rowHeight: number;
  /** Extra rows rendered above/below the viewport to hide scroll seams. */
  overscan?: number;
  /**
   * Below this row count, windowing is skipped entirely and every row renders —
   * the bookkeeping is not worth it for short lists.
   */
  threshold?: number;
};

const DEFAULT_OVERSCAN = 8;
const DEFAULT_THRESHOLD = 100;

export const useWindowedRows = ({
  rowCount,
  rowHeight,
  overscan = DEFAULT_OVERSCAN,
  threshold = DEFAULT_THRESHOLD,
}: Options): WindowedRows => {
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: rowCount });

  const containerRef = useRef<HTMLTableSectionElement>(null);
  const frameRef = useRef<number | null>(null);

  const enabled = rowCount > threshold && rowHeight > 0;

  const recompute = useCallback((): void => {
    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    // Distance the viewport top has travelled into the rows region.
    const scrolledInto = Math.max(0, -rect.top);
    const viewportEnd = scrolledInto + window.innerHeight;

    const start = Math.max(0, Math.floor(scrolledInto / rowHeight) - overscan);
    const end = Math.min(rowCount, Math.ceil(viewportEnd / rowHeight) + overscan);

    setRange((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, [rowCount, rowHeight, overscan]);

  /** Coalesce scroll bursts into one measurement per animation frame. */
  const scheduleRecompute = useCallback((): void => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      recompute();
    });
  }, [recompute]);

  useEffect(() => {
    if (!enabled) {
      setRange({ start: 0, end: rowCount });
      return;
    }

    recompute();
    window.addEventListener("scroll", scheduleRecompute, { passive: true });
    window.addEventListener("resize", scheduleRecompute);
    return () => {
      window.removeEventListener("scroll", scheduleRecompute);
      window.removeEventListener("resize", scheduleRecompute);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, rowCount, recompute, scheduleRecompute]);

  if (!enabled) {
    return { containerRef, startIndex: 0, endIndex: rowCount, topPadding: 0, bottomPadding: 0 };
  }

  const startIndex = Math.min(range.start, rowCount);
  const endIndex = Math.min(Math.max(range.end, startIndex), rowCount);

  return {
    containerRef,
    startIndex,
    endIndex,
    topPadding: startIndex * rowHeight,
    bottomPadding: Math.max(0, (rowCount - endIndex) * rowHeight),
  };
};
