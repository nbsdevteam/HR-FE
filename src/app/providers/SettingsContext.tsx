import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { getIntlLocale } from "@/i18n";

// ── Month format types ──
export type MonthFormat = "name" | "numeric";

export interface AppSettings {
  monthFormat: MonthFormat;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const STORAGE_KEY = "hr-app-settings";

const defaultSettings: AppSettings = {
  monthFormat: "name",
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return defaultSettings;
  });

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;

export const useAppSettings = () => {
  return useContext(SettingsContext);
};

// ── Shared month formatting utility ──

/**
 * Format a "YYYY-MM" string based on user's preferred month format.
 * "name"    → localized long month and year
 * "numeric" → "2/2026"
 */
export const formatMonthYear = (monthYear: string, format: MonthFormat): string => {
  if (!monthYear) return "—";
  const [y, mo] = monthYear.split("-");
  if (!y || !mo) return monthYear;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, 1));
  return new Intl.DateTimeFormat(getIntlLocale(), {
    year: "numeric",
    month: format === "numeric" ? "numeric" : "long",
    timeZone: "UTC",
  }).format(date);
};

/**
 * Get just the month label (no year) based on format.
 * "name"    → localized long month
 * "numeric" → "2"
 */
export const formatMonthOnly = (monthNum: string, format: MonthFormat): string => {
  if (format === "numeric") {
    return new Intl.NumberFormat(getIntlLocale()).format(parseInt(monthNum, 10));
  }
  const date = new Date(Date.UTC(2024, Number(monthNum) - 1, 1));
  return new Intl.DateTimeFormat(getIntlLocale(), {
    month: "long",
    timeZone: "UTC",
  }).format(date);
};
