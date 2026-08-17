export const groupByCategory = <T extends { category?: string | null }>(
  items: T[] | null | undefined,
  fallbackCategory: string,
): Record<string, T[]> => (
  (items || []).reduce<Record<string, T[]>>((acc, item) => {
    const key = item.category || fallbackCategory;
    (acc[key] ??= []).push(item);
    return acc;
  }, {})
);
