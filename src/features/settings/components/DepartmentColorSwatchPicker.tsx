import { X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { DEPT_COLOR_PALETTE } from "../constants/settings";
import DepartmentColorSwatch from "./DepartmentColorSwatch";

type TDepartmentColorSwatchPickerProps = {
  activeColor: string;
  activeDeptName: string | undefined;
  usedDeptColors: Set<string>;
  onSelectColor: (color: string) => void;
  onCustomColorChange: (color: string) => void;
  onClose: () => void;
};

const DepartmentColorSwatchPicker = ({
  activeColor,
  activeDeptName,
  usedDeptColors,
  onSelectColor,
  onCustomColorChange,
  onClose,
}: TDepartmentColorSwatchPickerProps) => {
  const handleSelectColor = (color: string) => (): void => {
    onSelectColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onCustomColorChange(e.target.value);
  };

  return (
    <div className="bg-muted/10 border border-border/30 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {arabicSource("settings.choose_a_color_for")}{" "}
          <span className="text-foreground">{activeDeptName}</span>:
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted/30 transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DEPT_COLOR_PALETTE.map((color) => (
          <DepartmentColorSwatch
            key={color}
            color={color}
            isUsed={usedDeptColors.has(color) && color !== activeColor}
            isSelected={color === activeColor}
            onClick={handleSelectColor(color)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/20">
        <label
          className="text-muted-foreground shrink-0"
          style={{ fontSize: 10 }}
        >
          {arabicSource("settings.customized_color")}
        </label>
        <input
          type="color"
          value={activeColor}
          onChange={handleCustomColorChange}
          className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0"
          style={{ WebkitAppearance: "none", appearance: "none" }}
        />
        <span
          className="text-muted-foreground font-mono"
          style={{ fontSize: 10 }}
        >
          {activeColor}
        </span>
      </div>
    </div>
  );
};

export default DepartmentColorSwatchPicker;
