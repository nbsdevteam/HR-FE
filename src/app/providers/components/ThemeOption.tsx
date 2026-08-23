import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { ThemeId } from "../ThemeContext";

type ThemePreview = {
  bg: string;
  accent: string;
  text: string;
};

type ThemeOptionProps = {
  id: ThemeId;
  label: string;
  preview: ThemePreview;
  isActive: boolean;
  onSelect: (id: ThemeId) => void;
};

/**
 * One entry in the theme menu. Extracted from the inline `themes.map(...)` in
 * `ThemeSwitcher` so the menu passes one stable callback rather than a new
 * closure per theme on every render.
 */
const ThemeOption = ({ id, label, preview, isActive, onSelect }: ThemeOptionProps) => {
  const handleClick = useCallback((): void => {
    onSelect(id);
  }, [onSelect, id]);

  return (
    <motion.button
      whileHover={{ x: -4 }}
      onClick={handleClick}
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
          style={{ backgroundColor: preview.bg }}
        />
        <div
          className="w-5 h-5 rounded-full border border-white/20"
          style={{ backgroundColor: preview.accent }}
        />
        <div
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ backgroundColor: preview.text }}
        />
      </div>

      <span className="flex-1 text-start text-foreground" style={{ fontSize: 13 }}>
        {label}
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
};

export default memo(ThemeOption);
