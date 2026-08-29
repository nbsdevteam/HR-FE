import ar from "./locales/ar.json";

export type ArabicSourceKey = keyof typeof ar;

/**
 * Returns the canonical Arabic backend/source value for a semantic key.
 * Rendering is localized by the application i18n layer; database comparisons
 * continue to use the Arabic values already stored by the existing backend.
 */
export const arabicSource = (key: ArabicSourceKey): string => {
  return ar[key];
}
