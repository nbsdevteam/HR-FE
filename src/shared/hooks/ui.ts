import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Closes when a pointerdown/mousedown lands outside `ref` (or all of them,
 * if given an array) while `active`, and optionally on Escape. `onOutside`
 * is read through a ref so callers don't need to memoize it.
 *
 * Shared by the app's outside-click dropdowns (TopBar's notification/device/
 * user menus, the language and theme switchers) — previously each hand-rolled
 * its own `mousedown`/`keydown` listener pair.
 */
export const useClickOutside = (
  active: boolean,
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onOutside: () => void,
  closeOnEscape = true,
): void => {
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;

  useEffect(() => {
    if (!active) return;
    const refs = Array.isArray(ref) ? ref : [ref];
    const isInside = (target: Node): boolean => refs.some((r) => r.current?.contains(target));

    const handlePointerDown = (ev: MouseEvent): void => {
      if (!isInside(ev.target as Node)) onOutsideRef.current();
    };
    const handleKeyDown = (ev: KeyboardEvent): void => {
      if (closeOnEscape && ev.key === "Escape") onOutsideRef.current();
    };

    document.addEventListener("mousedown", handlePointerDown);
    if (closeOnEscape) document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      if (closeOnEscape) document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, closeOnEscape]);
};

export type PopupRect = { top: number; left: number; width: number };

/**
 * Tracks the floating-panel position for a portaled dropdown anchored below
 * `anchorRef`, and closes it (via `onClose`) on outside-pointerdown, Escape,
 * scroll, or resize. Extracted from the near-identical position-tracking
 * effects in `Select.tsx` and `TypeAhead.tsx` — both computed the same
 * `{top, left, width}` rect off `getBoundingClientRect()` with the same gap
 * and the same four listeners.
 */
export const usePopupPosition = (
  open: boolean,
  onClose: () => void,
  gapPx = 4,
): { anchorRef: RefObject<HTMLDivElement | null>; rect: PopupRect | null } => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<PopupRect | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const updatePosition = (): void => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      setRect({ top: r.bottom + gapPx, left: r.left, width: r.width });
    };
    updatePosition();

    const handlePointerDown = (ev: MouseEvent): void => {
      if (!anchorRef.current?.contains(ev.target as Node)) onCloseRef.current();
    };
    const handleKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, gapPx]);

  return { anchorRef, rect };
};
