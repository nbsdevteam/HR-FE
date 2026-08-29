import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Palette } from "lucide-react";
import { useTheme, themes, type ThemeId } from "./ThemeContext";
import { arabicSource } from "@/i18n/source";
import { useClickOutside } from "@/shared/hooks/ui";
import DropdownPanel from "@/app/components/DropdownPanel";
import ThemeOption from "./components/ThemeOption";

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const handleToggleOpen = useCallback((): void => {
    setOpen((value) => !value);
  }, []);
  const handleClose = useCallback((): void => setOpen(false), []);

  const handleSelectTheme = useCallback(
    (id: ThemeId): void => {
      setTheme(id);
      setOpen(false);
    },
    [setTheme]
  );

  useClickOutside(open, ref, handleClose, false);

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

      <DropdownPanel isOpen={open} widthClassName="w-64">
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
      </DropdownPanel>
    </div>
  );
};

export default ThemeSwitcher;
