import { arabicSource } from "@/i18n/source";

type DepartmentColorSwatchProps = {
  color: string;
  isUsed: boolean;
  isSelected: boolean;
  onClick: () => void;
};

const DepartmentColorSwatch = ({ color, isUsed, isSelected, onClick }: DepartmentColorSwatchProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isUsed}
    className={`w-8 h-8 rounded-lg border-2 transition-all ${
      isSelected ? "border-foreground scale-110 ring-2 ring-primary/40" :
      isUsed ? "border-border/20 opacity-25 cursor-not-allowed" :
      "border-border/40 hover:scale-110 hover:border-foreground/40"
    }`}
    style={{ background: color }}
    title={isUsed ? arabicSource("settings.is_already_in_use") : isSelected ? arabicSource("settings.current_color") : ""}
  />
);

export default DepartmentColorSwatch;
