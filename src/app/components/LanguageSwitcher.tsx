import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  changeLanguage,
  languageOptions,
  normalizeLanguage,
  type AppLanguage,
} from "../i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <label className="relative flex items-center" title="Language / اللغة / زمان">
      <Languages
        aria-hidden="true"
        className="pointer-events-none absolute start-2.5 h-4 w-4 text-muted-foreground"
      />
      <span className="sr-only">Language / اللغة / زمان</span>
      <select
        aria-label="Language / اللغة / زمان"
        value={current}
        onChange={(event) => void changeLanguage(event.target.value as AppLanguage)}
        className="h-9 max-w-32 cursor-pointer appearance-none rounded-lg border border-border bg-input-background ps-8 pe-7 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code} dir={option.dir}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
