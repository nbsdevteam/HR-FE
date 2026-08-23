import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import type { AppLanguage } from "@/i18n";

type LanguageOptionProps = {
  code: AppLanguage;
  label: string;
  dir: string;
  selected: boolean;
  onSelect: (code: AppLanguage) => void;
};

/**
 * One entry in the language menu. Extracted from the inline
 * `languageOptions.map(...)` in `LanguageSwitcher` so the menu passes one
 * stable callback instead of a new closure per option on every render.
 */
const LanguageOption = ({ code, label, dir, selected, onSelect }: LanguageOptionProps) => {
  const handleClick = useCallback((): void => {
    onSelect(code);
  }, [onSelect, code]);

  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      dir={dir}
      onClick={handleClick}
      className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
        selected ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted/30"
      }`}
    >
      <span>{label}</span>
      {selected && <Check aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
};

export default memo(LanguageOption);
