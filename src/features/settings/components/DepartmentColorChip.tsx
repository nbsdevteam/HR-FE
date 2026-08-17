import type { DbDepartment } from "@/shared/hooks";

type DepartmentColorChipProps = {
  department: DbDepartment;
  currentColor: string;
  isOpen: boolean;
  isEdited: boolean;
  onClick: () => void;
};

export const DepartmentColorChip = ({ department, currentColor, isOpen, isEdited, onClick }: DepartmentColorChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
      isOpen
        ? "border-primary/50 bg-primary/10 shadow-sm"
        : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-muted/15"
    }`}
  >
    <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20" style={{ background: currentColor }} />
    <span className="text-foreground whitespace-nowrap" style={{ fontSize: 11 }}>{department.name}</span>
    {isEdited && (
      <div className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-amber-400 border border-card" />
    )}
  </button>
);
