import { PlusCircle } from "lucide-react";
import type { ReactNode } from "react";

type TabAddToggleHeaderProps = {
  description: ReactNode;
  isEditing: boolean;
  addLabel: ReactNode;
  onToggle: () => void;
};

const TabAddToggleHeader = ({ description, isEditing, addLabel, onToggle }: TabAddToggleHeaderProps) => (
  <div className="flex items-center justify-between">
    <p className="text-muted-foreground" style={{ fontSize: 13 }}>{description}</p>
    {isEditing && (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
        style={{ fontSize: 12 }}
      >
        <PlusCircle className="w-4 h-4" />
        {addLabel}
      </button>
    )}
  </div>
);

export default TabAddToggleHeader;
