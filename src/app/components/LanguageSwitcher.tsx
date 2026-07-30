import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  changeLanguage,
  languageOptions,
  normalizeLanguage,
  type AppLanguage,
} from "../i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const selectorLabel = t("languages.selector_label");
  const languageName = (language: AppLanguage) =>
    i18n.getFixedT(language)("languages.self_name");

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef} data-i18n-ignore>
      <motion.button
        ref={triggerRef}
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        aria-label={selectorLabel}
        title={selectorLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-input-background px-2.5 text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Languages aria-hidden="true" className="h-4 w-4 text-primary" />
        <span className="hidden text-xs sm:inline">{languageName(current)}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={selectorLabel}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-full z-[120] mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl"
          >
            {languageOptions.map((option) => {
              const selected = option.code === current;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  dir={option.dir}
                  onClick={() => {
                    void changeLanguage(option.code);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
                    selected
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-muted/30"
                  }`}
                >
                  <span>{languageName(option.code)}</span>
                  {selected && <Check aria-hidden="true" className="h-4 w-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
