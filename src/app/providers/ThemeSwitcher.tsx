import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette } from "lucide-react";
import { useTheme, themes, type ThemeId } from "./ThemeContext";
import { arabicSource } from "@/i18n/source";
import ThemeOption from "./components/ThemeOption";

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const handleToggleOpen = useCallback((): void => {
    setOpen((value) => !value);
  }, []);

  const handleSelectTheme = useCallback(
    (id: ThemeId): void => {
      setTheme(id);
      setOpen(false);
    },
    [setTheme]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        onClick={handleToggleOpen}
        className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        title={arabicSource("shared.change_the_theme")}
      >
        <Palette className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 end-0 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 border-b border-border/40">
              <p className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.choose_the_theme")}</p>
            </div>
            <div className="p-2 space-y-1">
              {themes.map((t) => (
                <ThemeOption
                  key={t.id}
                  id={t.id}
                  label={t.label}
                  preview={t.preview}
                  isActive={theme === t.id}
                  onSelect={handleSelectTheme}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
