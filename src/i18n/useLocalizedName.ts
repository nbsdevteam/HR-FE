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
