import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Closes when a pointerdown/mousedown lands outside `ref` (or all of them,
 * if given an array) while `active`. `onOutside` is read through a ref so
 * callers don't need to memoize it.
 *
 * `escape` controls Escape-key handling: `true` (default) re-runs
 * `onOutside`, `false` disables it, and a function runs instead of
 * `onOutside` for callers that need different behavior on keyboard dismiss
 * (e.g. also returning focus to the trigger button).
 *
 * Shared by the app's outside-click dropdowns (TopBar's notification/device/
 * user menus, the language and theme switchers) — previously each hand-rolled
 * its own `mousedown`/`keydown` listener pair.
 */
export const useClickOutside = (
  active: boolean,
  ref: RefObject<HTMLElement> | RefObject<HTMLElement>[],
  onOutside: () => void,
  escape: boolean | (() => void) = true,
): void => {
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;
  const onEscapeRef = useRef(escape);
  onEscapeRef.current = escape;

  useEffect(() => {
    if (!active) return;
    const refs = Array.isArray(ref) ? ref : [ref];
    const isInside = (target: Node): boolean => refs.some((r) => r.current?.contains(target));
    const closeOnEscape = onEscapeRef.current !== false;

    const handlePointerDown = (ev: MouseEvent): void => {
      if (!isInside(ev.target as Node)) onOutsideRef.current();
    };
    const handleKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key !== "Escape") return;
      const handler = onEscapeRef.current;
      (typeof handler === "function" ? handler : onOutsideRef.current)();
    };

    document.addEventListener("mousedown", handlePointerDown);
    if (closeOnEscape) document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      if (closeOnEscape) document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
};

export type PopupRect = { left: number; width: number; top?: number; bottom?: number };

/**
 * Tracks the floating-panel position for a portaled dropdown anchored to
 * `anchorRef`, and closes it (via `onClose`) on outside-pointerdown, Escape,
 * scroll, or resize. Extracted from the near-identical position-tracking
 * effects in `Select.tsx` and `TypeAhead.tsx` — both computed the same
 * `{left, width}` rect off `getBoundingClientRect()` with the same gap and
 * the same four listeners.
 *
 * `placement` picks the *preferred* side of the anchor the popup grows from:
 * "bottom" (default) sets `rect.top` below the anchor; "top" sets
 * `rect.bottom` (measured from the viewport bottom) above the anchor. If the
 * preferred side doesn't have room for a max-height popup, the position is
 * flipped to whichever side has more space — anchors near the bottom of a
 * long, page-scrolling list would otherwise render their popup past the
 * bottom of the viewport, where it's clipped and unreachable.
 */
const POPUP_MAX_HEIGHT = 288; // matches the `max-h-72` popup panels in Select/MultiSelect/TypeAhead

export const usePopupPosition = (
  open: boolean,
  onClose: () => void,
  gapPx = 4,
  placement: "top" | "bottom" = "bottom",
): { anchorRef: RefObject<HTMLDivElement>; rect: PopupRect | null } => {
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
      const spaceBelow = window.innerHeight - r.bottom - gapPx;
      const spaceAbove = r.top - gapPx;
      const preferTop = placement === "top";
      const fitsPreferred = preferTop
        ? spaceAbove >= POPUP_MAX_HEIGHT
        : spaceBelow >= POPUP_MAX_HEIGHT;
      const openTop = fitsPreferred ? preferTop : spaceAbove > spaceBelow;

      setRect(
        openTop
          ? { bottom: window.innerHeight - r.top + gapPx, left: r.left, width: r.width }
          : { top: r.bottom + gapPx, left: r.left, width: r.width },
      );
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
  }, [open, gapPx, placement]);

  return { anchorRef, rect };
};
