import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Check } from "lucide-react";
import { useTheme, themes } from "./ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        title="تغيير الثيم"
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
              <p className="text-foreground" style={{ fontSize: 13 }}>اختر الثيم</p>
            </div>
            <div className="p-2 space-y-1">
              {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileHover={{ x: -4 }}
                    onClick={() => {
                      setTheme(t.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/15 border border-primary/30"
                        : "hover:bg-muted/30 border border-transparent"
                    }`}
                  >
                    {/* Color preview circles */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: t.preview.bg }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: t.preview.accent }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: t.preview.text }}
                      />
                    </div>

                    <span className="flex-1 text-start text-foreground" style={{ fontSize: 13 }}>
                      {t.label}
                    </span>

                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-4 h-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
