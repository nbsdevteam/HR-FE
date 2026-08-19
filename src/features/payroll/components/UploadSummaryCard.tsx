import type { LucideIcon } from "lucide-react";
import { payrollCardClass as cardCls } from "../styles";

type UploadSummaryCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
};

const UploadSummaryCard = ({ label, value, icon: Icon }: UploadSummaryCardProps) => (
  <div className={`${cardCls} p-4`}>
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</p>
        <span className="text-foreground" style={{ fontSize: 20 }}>{value}</span>
      </div>
    </div>
  </div>
);

export default UploadSummaryCard;
