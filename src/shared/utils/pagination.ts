/** A gap between two page-number runs, rendered as an ellipsis. */
export const PAGE_GAP = "gap" as const;

export type PageWindowItem = number | typeof PAGE_GAP;

/**
 * Page numbers to render for `current` of `totalPages`, always including the
 * first and last page and a run of `radius` pages either side of the current
 * one, with `PAGE_GAP` standing in for anything skipped.
 *
 * Kept pure and separate from the component so the edge cases (a single page,
 * a current page adjacent to either end, a run that would leave a one-page
 * "gap") can be tested without rendering.
 */
export const pageWindow = (current: number, totalPages: number, radius = 2): PageWindowItem[] => {
  if (!Number.isFinite(totalPages) || totalPages < 1) return [1];
  const page = Math.min(Math.max(1, current), totalPages);

  const pages = new Set<number>([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: PageWindowItem[] = [];
  let previous = 0;
  for (const p of sorted) {
    // A gap of exactly one page is worse than just showing that page — an
    // ellipsis hiding a single number costs the same width and one more click.
    if (previous && p - previous === 2) items.push(previous + 1);
    else if (previous && p - previous > 2) items.push(PAGE_GAP);
    items.push(p);
    previous = p;
  }
  return items;
};

/** Inclusive 1-based row range covered by a page, for the "x–y of z" summary. */
export const pageRange = (page: number, perPage: number, total: number): { from: number; to: number } => {
  if (total <= 0 || perPage <= 0) return { from: 0, to: 0 };
  const from = (Math.max(1, page) - 1) * perPage + 1;
  if (from > total) return { from: 0, to: 0 };
  return { from, to: Math.min(from + perPage - 1, total) };
};
