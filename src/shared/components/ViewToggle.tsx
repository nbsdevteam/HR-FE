import { useCallback } from "react";
import { motion } from "motion/react";
import { LayoutList, Columns3 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

interface ViewToggleProps {
  view: "list" | "kanban";
  onChange: (view: "list" | "kanban") => void;
}

const ViewToggle = ({ view, onChange }: ViewToggleProps) => {
  const handleSelectList = useCallback((): void => {
    onChange("list");
  }, [onChange]);

  const handleSelectKanban = useCallback((): void => {
    onChange("kanban");
  }, [onChange]);

  return (
    <div className="flex items-center bg-secondary/60 border border-border/40 rounded-lg p-0.5">
      <button
        onClick={handleSelectList}
        className="relative p-2 rounded-md cursor-pointer transition-colors"
        title={arabicSource("shared.show_list")}
      >
        {view === "list" && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-primary rounded-md shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <LayoutList className={`w-4 h-4 relative z-10 transition-colors ${view === "list" ? "text-primary-foreground" : "text-muted-foreground"}`} />
      </button>
      <button
        onClick={handleSelectKanban}
        className="relative p-2 rounded-md cursor-pointer transition-colors"
        title={arabicSource("shared.kanban_view")}
      >
        {view === "kanban" && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-primary rounded-md shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Columns3 className={`w-4 h-4 relative z-10 transition-colors ${view === "kanban" ? "text-primary-foreground" : "text-muted-foreground"}`} />
      </button>
    </div>
  );
};

export default ViewToggle;
