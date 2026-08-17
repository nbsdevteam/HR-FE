import type { ComponentType, ReactNode } from "react";

type EmployeeFieldRowProps = {
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  value: ReactNode;
  dir?: "ltr";
  isEditing: boolean;
  editElement?: ReactNode;
  highlight?: boolean;
};

const EmployeeFieldRow = ({
  icon: Icon,
  iconColor = "text-primary",
  label,
  value,
  dir,
  isEditing,
  editElement,
  highlight,
}: EmployeeFieldRowProps) => (
  <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)", borderBottomStyle: "solid", opacity: 0.9 }}>
    <Icon className={`w-5 h-5 ${iconColor} shrink-0`} />
    <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{label}:</span>
    <div className="flex-1 min-w-0">
      {isEditing && editElement ? (
        editElement
      ) : (
        <span className={highlight ? "text-gradient-gold" : "text-foreground"} style={{ fontSize: 14 }} dir={dir}>
          {value}
        </span>
      )}
    </div>
  </div>
);

export default EmployeeFieldRow;
