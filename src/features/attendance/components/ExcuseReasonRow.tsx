import { ShieldCheck } from "lucide-react";

type ExcuseReasonRowProps = {
  label: string;
};

const ExcuseReasonRow = ({ label }: ExcuseReasonRowProps) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    <span className="text-foreground" style={{ fontSize: 12 }}>{label}</span>
  </div>
);

export default ExcuseReasonRow;
