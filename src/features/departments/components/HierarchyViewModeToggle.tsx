import { GitBranch, Network } from "lucide-react";
import { TabButton, TabGroup } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type ViewMode = "tree" | "positions";

type HierarchyViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

const HierarchyViewModeToggle = ({ viewMode, onViewModeChange }: HierarchyViewModeToggleProps) => (
  <TabGroup>
    <TabButton
      id="tree"
      label={arabicSource("hierarchy.current_structure")}
      icon={GitBranch}
      isActive={viewMode === "tree"}
      onSelect={onViewModeChange}
    />
    <TabButton
      id="positions"
      label={arabicSource("hierarchy.positions_and_appointments")}
      icon={Network}
      isActive={viewMode === "positions"}
      onSelect={onViewModeChange}
    />
  </TabGroup>
);

export default HierarchyViewModeToggle;
