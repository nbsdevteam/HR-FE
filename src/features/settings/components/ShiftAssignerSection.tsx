import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import ShiftAssigner from "@/features/attendance/components/ShiftAssigner";
import { arabicSource } from "@/i18n/source";

const ShiftAssignerSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOpen = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-t border-border/20 pt-4">
      <button
        onClick={handleToggleOpen}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h4 className="text-foreground" style={{ fontSize: 14 }}>
            {arabicSource("settings.assigning_employees_to_shifts")}
          </h4>
          <span className="text-muted-foreground text-xs">
            {arabicSource("settings.drag_and_drop")}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="mt-2">
          <ShiftAssigner />
        </div>
      )}
    </div>
  );
};

export default ShiftAssignerSection;
