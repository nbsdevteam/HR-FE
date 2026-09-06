/** A gap between two page-number runs, rendered as an ellipsis. */
export const PAGE_GAP = "gap" as const;

export type PageWindowItem = number | typeof PAGE_GAP;

/**
 * Page numbers to render for `current` of `totalPages`: the first and last
 * page plus a run of `radius` pages either side of the current one, with
 * `PAGE_GAP` standing in for anything skipped. Below the full-list threshold
 * (`totalPages <= radius * 2 + 3`, where windowing would save no real space)
 * every page is listed instead.
 *
 * The window always keeps a fixed width — it never merges into the last page
 * just because the two happen to land next to each other — so the visible
 * button count stays predictable no matter where `current` sits.
 *
 * Kept pure and separate from the component so the edge cases (a single page,
 * a current page adjacent to either end, a small `totalPages`) can be tested
 * without rendering.
 */
export const pageWindow = (current: number, totalPages: number, radius = 1): PageWindowItem[] => {
  if (!Number.isFinite(totalPages) || totalPages < 1) return [1];
  const page = Math.min(Math.max(1, current), totalPages);

  if (totalPages <= radius * 2 + 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, page - radius);
  const end = Math.min(totalPages - 1, page + radius);

  const items: PageWindowItem[] = [1];
  if (start > 2) items.push(PAGE_GAP);
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < totalPages - 1) items.push(PAGE_GAP);
  items.push(totalPages);
  return items;
};

/** Inclusive 1-based row range covered by a page, for the "x–y of z" summary. */
export const pageRange = (page: number, perPage: number, total: number): { from: number; to: number } => {
  if (total <= 0 || perPage <= 0) return { from: 0, to: 0 };
  const from = (Math.max(1, page) - 1) * perPage + 1;
  if (from > total) return { from: 0, to: 0 };
  return { from, to: Math.min(from + perPage - 1, total) };
};
