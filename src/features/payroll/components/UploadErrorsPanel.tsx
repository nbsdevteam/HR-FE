import { AlertCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import UploadErrorItem from "./UploadErrorItem";

type UploadErrorsPanelProps = {
  errors: string[];
};

const UploadErrorsPanel = ({ errors }: UploadErrorsPanelProps) => (
  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5 text-destructive" />
      <span className="text-destructive" style={{ fontSize: 14 }}>{arabicSource("payroll.warnings")}{errors.length})</span>
    </div>
    <ul className="space-y-1 max-h-32 overflow-y-auto">
      {errors.slice(0, 20).map((err, i) => (
        <UploadErrorItem key={i} message={err} />
      ))}
      {errors.length > 20 && (
        <li className="text-destructive/60 ps-4" style={{ fontSize: 12 }}>{arabicSource("payroll.and")} {errors.length - 20} {arabicSource("payroll.another_warning")}</li>
      )}
    </ul>
  </div>
);

export default UploadErrorsPanel;
