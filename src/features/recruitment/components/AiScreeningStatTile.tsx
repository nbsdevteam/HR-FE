import { memo } from "react";

type AiScreeningStatTileProps = {
  label: string;
  value: string | number;
};

const AiScreeningStatTile = ({ label, value }: AiScreeningStatTileProps) => (
  <div className="bg-card/30 border border-border/40 rounded-xl p-4">
    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</p>
    <span className="text-gradient-gold block mt-1" style={{ fontSize: 22 }}>{value}</span>
  </div>
);

export default memo(AiScreeningStatTile);
