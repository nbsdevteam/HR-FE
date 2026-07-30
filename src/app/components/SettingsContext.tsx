import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(SettingsContext);
}

// ── Shared month formatting utility ──

const IRAQI_MONTH_NAMES: Record<string, string> = {
  "01": "كانون الثاني", "02": "شباط", "03": "آذار", "04": "نيسان",
  "05": "أيار", "06": "حزيران", "07": "تموز", "08": "آب",
  "09": "أيلول", "10": "تشرين الأول", "11": "تشرين الثاني", "12": "كانون الأول",
};

/**
 * Format a "YYYY-MM" string based on user's preferred month format.
 * "name"    → "شباط 2026"
 * "numeric" → "2/2026"
 */
export function formatMonthYear(monthYear: string, format: MonthFormat): string {
  if (!monthYear) return "—";
  const [y, mo] = monthYear.split("-");
  if (!y || !mo) return monthYear;
  if (format === "numeric") {
    return `${parseInt(mo, 10)}/${y}`;
  }
  return `${IRAQI_MONTH_NAMES[mo] || mo} ${y}`;
}

/**
 * Get just the month label (no year) based on format.
 * "name"    → "شباط"
 * "numeric" → "2"
 */
export function formatMonthOnly(monthNum: string, format: MonthFormat): string {
  if (format === "numeric") {
    return `${parseInt(monthNum, 10)}`;
  }
  return IRAQI_MONTH_NAMES[monthNum] || monthNum;
}
