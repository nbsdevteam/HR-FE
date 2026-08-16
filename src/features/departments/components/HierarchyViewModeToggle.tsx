import { GitBranch, Network } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type ViewMode = "tree" | "positions";

type HierarchyViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

export const HierarchyViewModeToggle = ({ viewMode, onViewModeChange }: HierarchyViewModeToggleProps) => (
  <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
    <button onClick={() => onViewModeChange("tree")}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
        viewMode === "tree" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`} style={{ fontSize: 13 }}>
      <GitBranch className="w-4 h-4" /> {arabicSource("hierarchy.current_structure")}
    </button>
    <button onClick={() => onViewModeChange("positions")}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
        viewMode === "positions" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`} style={{ fontSize: 13 }}>
      <Network className="w-4 h-4" /> {arabicSource("hierarchy.positions_and_appointments")}
    </button>
  </div>
);
