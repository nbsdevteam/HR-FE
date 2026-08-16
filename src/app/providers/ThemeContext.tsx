import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { arabicSource } from "@/i18n/source";

export type ThemeId = "dark-enhanced" | "light-turquoise";

interface ThemeInfo {
  id: ThemeId;
  label: string;
  className: string;
  preview: { bg: string; accent: string; text: string };
}

export const themes: ThemeInfo[] = [
  {
    id: "dark-enhanced",
    label: arabicSource("shared.dark_golden"),
    className: "dark-enhanced",
    preview: { bg: "#050505", accent: "#F0C419", text: "#FFF8E1" },
  },
  {
    id: "light-turquoise",
    label: arabicSource("shared.light_turquoise"),
    className: "light-turquoise",
    preview: { bg: "#FFFFFF", accent: "#06B6D4", text: "#0F172A" },
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeInfo: ThemeInfo;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark-enhanced",
  setTheme: () => {},
  themeInfo: themes[0],
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem("hr-theme");
    if (saved === "dark-enhanced" || saved === "light-turquoise") return saved;
    return "dark-enhanced";
  });

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem("hr-theme", newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove("dark-gold", "dark-enhanced", "light-turquoise");
    // Add current theme class
    root.classList.add(theme);
  }, [theme]);

  const themeInfo = themes.find((t) => t.id === theme) || themes[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeInfo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}