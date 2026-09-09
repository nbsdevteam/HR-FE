/**
 * Trims, collapses whitespace, case-folds, and folds Arabic letter variants
 * that people type interchangeably — أ/إ/آ all fold to ا, and ة folds to ه —
 * so "اجهزة البصمة" and "أجهزة البصمه" match the same item.
 */
export const normalizeSearchText = (value: string): string =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");

/**
 * Replaces cmdk's default fuzzy `command-score` filter with plain substring
 * matching over a pre-normalized haystack. Each item's `keywords` (see
 * CommandPaletteItem) already carry the Arabic, English, and Kurdish forms of
 * its label, so a query in any one of the three languages matches regardless
 * of which language the palette is currently displayed in.
 */
export const commandFilter = (value: string, search: string, keywords?: string[]): number => {
  const query = normalizeSearchText(search);
  if (!query) return 1;
  const haystack = normalizeSearchText([value, ...(keywords ?? [])].join(" "));
  return haystack.includes(query) ? 1 : 0;
};
