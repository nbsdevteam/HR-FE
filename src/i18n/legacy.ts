import i18n, { normalizeLanguage, type AppLanguage } from "./index";
import sourceMap from "./locales/source-map.json";

const sourceKeys = sourceMap as Record<string, string>;
const arabicPattern = /\p{Script=Arabic}/u;

/**
 * Arabic letters and their combining marks. A catalogued fragment may only
 * replace a whole word: Arabic inflects by gluing prefixes and suffixes onto
 * the stem, so a bare `includes` match happily fires in the middle of a longer
 * word and strands the remaining letters against the English replacement
 * ("الموظفين" → "Employeeين").
 *
 * The leading boundary is a capture group rather than a lookbehind — these
 * patterns are built at module load, and lookbehind is unsupported before
 * Safari 16.4, where the SyntaxError would take the whole app down.
 */
const ARABIC_LETTER = "\\u0621-\\u064A\\u064B-\\u0652\\u0670-\\u06D3";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replacementEntries = Object.entries(sourceKeys)
  .filter(([source]) => source.length > 1)
  .sort(([left], [right]) => right.length - left.length)
  .map(([source, key]) => ({
    key,
    pattern: new RegExp(
      `(^|[^${ARABIC_LETTER}])${escapeRegExp(source)}(?![${ARABIC_LETTER}])`,
      "g",
    ),
  }));

function preserveOuterWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export const translateArabicSource = (
  value: string,
  language: AppLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
): string => {
  if (!value || language === "ar" || !arabicPattern.test(value)) return value;
  const normalized = value.replace(/\s+/g, " ").trim();
  const exactKey = sourceKeys[normalized];
  if (exactKey) {
    return preserveOuterWhitespace(value, i18n.getFixedT(language)(exactKey));
  }

  let translated = value;
  for (const { pattern, key } of replacementEntries) {
    pattern.lastIndex = 0;
    if (!pattern.test(translated)) continue;
    pattern.lastIndex = 0;
    // `$1` re-emits the boundary character the pattern had to consume.
    translated = translated.replace(
      pattern,
      (_match, boundary: string) => `${boundary}${i18n.getFixedT(language)(key)}`,
    );
  }
  return translated;
}

export const translationKeyForArabicSource = (source: string): string | undefined => {
  return sourceKeys[source.replace(/\s+/g, " ").trim()];
}

export const translateCataloguedValue = (
  value: string,
  language: AppLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
): string => {
  const key = translationKeyForArabicSource(value);
  return key ? i18n.getFixedT(language)(key) : value;
}

export const containsCataloguedArabicSource = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (sourceKeys[normalized]) return true;
  // Must use the same word-boundary rule as `translateArabicSource`: this gates
  // whether the DOM localizer registers a text node at all, so a looser test
  // here would remember nodes that translation then leaves untouched.
  return replacementEntries.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}
