import type { CSSProperties, ReactNode } from "react";

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  dir?: CSSProperties["direction"];
};

const InfoRow = ({ icon, label, value, dir }: InfoRowProps) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/10">
      <span className="text-primary flex-shrink-0">{icon}</span>
      <div>
        <span className="text-muted-foreground block" style={{ fontSize: 11 }}>{label}</span>
        <span className="text-foreground" style={{ fontSize: 13, direction: dir }}>{value}</span>
      </div>
    </div>
  );
};

export default InfoRow;
