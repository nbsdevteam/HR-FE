import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "./index";

type TLocalizedName = {
  primary: string;
  secondary: string | null;
  secondaryDir: "ltr" | undefined;
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
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const isArabic = language === "ar";

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
