import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "./index";

type TLocalizedName = {
  primary: string;
  secondary: string | null;
  secondaryDir: "ltr" | undefined;
};

/** Whether the active app language is Arabic — drives name_ar/name_en style field selection. */
export const useIsArabicLanguage = (): boolean => {
  const { i18n } = useTranslation();
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
};

/**
 * Backend records carry independent name_ar/name_en fields (not catalogued
 * UI copy), so they must bypass the global Arabic auto-translator and pick
 * their displayed language explicitly based on the active app language.
 */
export const useLocalizedName = (
  nameAr: string,
  nameEn: string | null | undefined,
): TLocalizedName => {
  const isArabic = useIsArabicLanguage();

  if (isArabic) {
    return {
      primary: nameAr,
      secondary: nameEn || null,
      secondaryDir: "ltr",
    };
  }

  return {
    primary: nameEn || nameAr,
    secondary: nameEn ? nameAr : null,
    secondaryDir: undefined,
  };
}

/**
 * Non-hook form for a plain name_ar/name_en pair, for callbacks a component
 * hands to a child (a TypeAhead's `getLabel`) or for hooks that build display
 * strings. Pair it with `useIsArabicLanguage` so the value tracks the language.
 */
export const localizedName = (
  nameAr: string,
  nameEn: string | null | undefined,
  isArabic: boolean,
): string => (isArabic ? nameAr || nameEn || "" : nameEn || nameAr || "");

/** The two name columns every employee record carries. */
export type TEmployeeNameFields = {
  name?: string | null;
  arabic_name?: string | null;
};

const LOGIN_LIKE = /^[a-z0-9._-]+$/i;
const ARABIC_SCRIPT = /[؀-ۿ]/;

/** "ahmed.ali" is a login handle the backend stores in `name`, not a person's name. */
const looksLikeLogin = (value: string): boolean =>
  LOGIN_LIKE.test(value) && (value.includes(".") || value.includes("_"));

/**
 * Splits an employee's `arabic_name`/`name` columns into the name_ar/name_en
 * pair the localized-name hooks expect, applying the same guards as
 * `empDisplayName`: an `arabic_name` holding Latin text is not an Arabic name,
 * and a login handle is not a display name.
 */
export const employeeNamePair = (
  employee: TEmployeeNameFields | null | undefined,
): { nameAr: string; nameEn: string | null } => {
  const arabic = (employee?.arabic_name ?? "").trim();
  const english = (employee?.name ?? "").trim();
  const usableArabic = ARABIC_SCRIPT.test(arabic) ? arabic : "";
  const usableEnglish = english && !looksLikeLogin(english) ? english : "";
  return {
    nameAr: usableArabic || usableEnglish || arabic || english || "—",
    nameEn: usableEnglish || null,
  };
};

/**
 * Non-hook form, for callbacks a component hands to a child (a TypeAhead's
 * `getLabel`, a `.map()` inside a render prop) where a hook cannot be called.
 * Pair it with `useIsArabicLanguage` so the value still tracks the language.
 */
export const localizedEmployeeName = (
  employee: TEmployeeNameFields | null | undefined,
  isArabic: boolean,
): string => {
  const { nameAr, nameEn } = employeeNamePair(employee);
  return isArabic ? nameAr : nameEn || nameAr;
};

/**
 * `empDisplayName` always prefers the Arabic column, which is what leaves an
 * English screen showing Arabic names next to English copy. This picks the
 * column that matches the active language instead, and falls back to whichever
 * one the record actually has.
 */
export const useLocalizedEmployeeName = (
  employee: TEmployeeNameFields | null | undefined,
): TLocalizedName => {
  const { nameAr, nameEn } = employeeNamePair(employee);
  return useLocalizedName(nameAr, nameEn);
};
