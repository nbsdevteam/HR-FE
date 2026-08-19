import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type RecordMetaItemProps = {
  icon: LucideIcon;
  label?: ReactNode;
  value: ReactNode;
};

const RecordMetaItem = ({ icon: Icon, label, value }: RecordMetaItemProps) => (
  <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
    <Icon className="w-3.5 h-3.5" />
    {label ? <>{label} <span dir="ltr" className="text-foreground">{value}</span></> : <span dir="ltr" className="text-foreground">{value}</span>}
  </span>
);

export default RecordMetaItem;
