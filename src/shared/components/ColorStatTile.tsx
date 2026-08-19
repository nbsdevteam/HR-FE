import type { ComponentType, ReactNode } from "react";

type ColorStatTileProps = {
  value: ReactNode;
  label: string;
  colorClassName: string;
  textColorClassName: string;
  icon?: ComponentType<{ className?: string }>;
  padding?: "p-3" | "p-4" | "p-5";
  valueTextClassName?: string;
  dir?: "ltr";
};

const ColorStatTile = ({
  value,
  label,
  colorClassName,
  textColorClassName,
  icon: Icon,
  padding = "p-4",
  valueTextClassName = "text-2xl font-semibold",
  dir,
}: ColorStatTileProps) => (
  <div className={`text-center ${padding} rounded-xl ${colorClassName}`}>
    {Icon && <Icon className={`w-8 h-8 ${textColorClassName} mx-auto mb-2`} />}
    <p className={`${valueTextClassName} ${textColorClassName}`} dir={dir}>{value}</p>
    <p className="text-muted-foreground text-xs mt-1">{label}</p>
  </div>
);

export default ColorStatTile;
