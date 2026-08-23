import { useCallback } from "react";
import type { LucideIcon } from "lucide-react";

type TabButtonProps<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: (id: T) => void;
};

const TabButton = <T extends string,>({ id, label, icon: Icon, isActive, onSelect }: TabButtonProps<T>) => {
  const handleClick = useCallback((): void => {
    onSelect(id);
  }, [onSelect, id]);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
        isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`}
      style={{ fontSize: 13 }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};

export default TabButton;
