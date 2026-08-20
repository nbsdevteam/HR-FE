import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import ku from "./locales/ku.json";

export const supportedLanguages = ["ar", "en", "ku"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const LANGUAGE_STORAGE_KEY = "hr-app-language";

export const languageOptions: ReadonlyArray<{
  code: AppLanguage;
  dir: "rtl" | "ltr";
  intlLocale: string;
}> = [
  { code: "en", dir: "rtl", intlLocale: "en-US" },
  { code: "ar", dir: "rtl", intlLocale: "ar-IQ" },
  { code: "ku", dir: "rtl", intlLocale: "ckb-IQ" },
];

export const normalizeLanguage = (value: string | null | undefined): AppLanguage => {
  const language = value?.toLowerCase().split("-")[0];
  return supportedLanguages.includes(language as AppLanguage)
    ? (language as AppLanguage)
    : "ar";
}

export const getLanguageDirection = (language: string): "rtl" | "ltr" => {
  return normalizeLanguage(language) === "en" ? "ltr" : "rtl";
}

export const getIntlLocale = (language = i18n.resolvedLanguage ?? i18n.language): string => {
  return languageOptions.find((option) => option.code === normalizeLanguage(language))?.intlLocale ?? "ar-IQ";
}

export const syncDocumentLocale = (language: string): void => {
  if (typeof document === "undefined") return;
  const normalized = normalizeLanguage(language);
  document.documentElement.lang = normalized;
  document.documentElement.dir = getLanguageDirection(normalized);
  const localizedTitle = i18n.getFixedT(normalized)("shared.human_resources_system");
  if (localizedTitle !== "shared.human_resources_system") {
    document.title = localizedTitle;
  }
}

function getInitialLanguage(): AppLanguage {
  if (typeof localStorage === "undefined") return "ar";
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "ar";
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    ku: { translation: ku },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  parseMissingKeyHandler: () => "",
  supportedLngs: supportedLanguages,
  keySeparator: false,
  nsSeparator: false,
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

syncDocumentLocale(i18n.language);

i18n.on("languageChanged", (language) => {
  const normalized = normalizeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Local storage can be unavailable in privacy-restricted browsers.
  }
  syncDocumentLocale(normalized);
});

export const changeLanguage = async (language: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
}

export default i18n;
