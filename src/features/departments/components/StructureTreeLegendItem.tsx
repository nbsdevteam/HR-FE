import type { ComponentType } from "react";

type StructureTreeLegendItemProps = {
  label: string;
  /** Omitted for the vacant swatch, which is a dashed frame rather than an icon. */
  icon?: ComponentType<{ className?: string }>;
};

const StructureTreeLegendItem = ({ label, icon: Icon }: StructureTreeLegendItemProps) => (
  <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 11.5 }}>
    {Icon ? (
      <Icon className="w-3.5 h-3.5 text-primary" />
    ) : (
      <span className="w-3.5 h-3.5 rounded border border-dashed border-flag-hair bg-flag-bg" />
    )}
    {label}
  </span>
);

export default StructureTreeLegendItem;
