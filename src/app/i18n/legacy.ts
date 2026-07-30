import i18n, { normalizeLanguage, type AppLanguage } from "./index";
import sourceMap from "./locales/source-map.json";

const sourceKeys = sourceMap as Record<string, string>;
const arabicPattern = /\p{Script=Arabic}/u;
const replacementEntries = Object.entries(sourceKeys)
  .filter(([source]) => source.length > 1)
  .sort(([left], [right]) => right.length - left.length);

function preserveOuterWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export function translateArabicSource(
  value: string,
  language: AppLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
): string {
  if (!value || language === "ar" || !arabicPattern.test(value)) return value;
  const normalized = value.replace(/\s+/g, " ").trim();
  const exactKey = sourceKeys[normalized];
  if (exactKey) {
    return preserveOuterWhitespace(value, i18n.getFixedT(language)(exactKey));
  }

  let translated = value;
  for (const [source, key] of replacementEntries) {
    if (translated.includes(source)) {
      translated = translated.split(source).join(i18n.getFixedT(language)(key));
    }
  }
  return translated;
}

export function translationKeyForArabicSource(source: string): string | undefined {
  return sourceKeys[source.replace(/\s+/g, " ").trim()];
}

export function containsCataloguedArabicSource(value: string): boolean {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (sourceKeys[normalized]) return true;
  return replacementEntries.some(([source]) => value.includes(source));
}
