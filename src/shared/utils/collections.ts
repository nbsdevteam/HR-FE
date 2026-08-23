/**
 * Index helpers for the `.find()`-inside-`.map()` pattern.
 *
 * Several list builders (employee mapper, warnings display, report generators,
 * training display) scanned a whole lookup array once per row, making them
 * O(rows x lookups). Building an index once turns those into O(rows).
 */

/** Build an id → item lookup. Later duplicates win, matching `.find()` last-write. */
export const indexBy = <T, K extends string | number>(
  items: readonly T[],
  getKey: (item: T) => K | null | undefined,
): Map<K, T> => {
  const index = new Map<K, T>();
  for (const item of items) {
    const key = getKey(item);
    if (key == null) continue;
    index.set(key, item);
  }
  return index;
};

/** Build an id → item[] lookup for one-to-many joins. */
export const groupBy = <T, K extends string | number>(
  items: readonly T[],
  getKey: (item: T) => K | null | undefined,
): Map<K, T[]> => {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    if (key == null) continue;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
};

/**
 * Bucket items by a derived key in one pass.
 * Replaces "filter the full array once per column" in kanban boards.
 */
export const countBy = <T, K extends string | number>(
  items: readonly T[],
  getKey: (item: T) => K | null | undefined,
): Map<K, number> => {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = getKey(item);
    if (key == null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};
