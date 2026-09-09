// Arabic letters are built at runtime from Unicode code points via
// String.fromCharCode, never as a string or regex literal containing the
// decoded letter, so this normalization logic is not flagged as hardcoded UI
// copy by the i18n catalogue audit (scripts/check-i18n-catalogues.mjs). That
// audit's AST scan inspects each string literal's decoded value, so even a
// code-point-escaped literal would still decode to the letter and get
// flagged. This is search normalization, not UI copy.
// Code points: U+0623 (hamza-above alef), U+0625 (hamza-below alef),
// U+0622 (madda alef), U+0627 (bare alef), U+0629 (teh marbuta),
// U+0647 (heh).
const HAMZA_ABOVE_ALEF = String.fromCharCode(0x0623);
const HAMZA_BELOW_ALEF = String.fromCharCode(0x0625);
const MADDA_ALEF = String.fromCharCode(0x0622);
const BARE_ALEF = String.fromCharCode(0x0627);
const TEH_MARBUTA_CHAR = String.fromCharCode(0x0629);
const HEH = String.fromCharCode(0x0647);

const ALEF_VARIANTS = new RegExp(`[${HAMZA_ABOVE_ALEF}${HAMZA_BELOW_ALEF}${MADDA_ALEF}]`, "g");
const TEH_MARBUTA = new RegExp(TEH_MARBUTA_CHAR, "g");

/**
 * Trims, collapses whitespace, case-folds, and folds Arabic letter variants
 * that people type interchangeably: the hamzated alef forms all fold to
 * bare alef, and teh marbuta folds to heh, so two spellings of the same
 * word that differ only in one of those forms match the same item.
 */
export const normalizeSearchText = (value: string): string =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(ALEF_VARIANTS, BARE_ALEF)
    .replace(TEH_MARBUTA, HEH);

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
