import { TriangleAlert } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";

type UploadSummaryDetailsProps = {
  checkIns: number;
  checkOuts: number;
  nones: number;
  dateRange: string[];
  unmatched: string[];
};

const UploadSummaryDetails = ({ checkIns, checkOuts, nones, dateRange, unmatched }: UploadSummaryDetailsProps) => (
  <div className={`${cardCls} p-5`}>
    <div className="flex flex-wrap gap-3">
      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: 12 }}>
        Check-in: {checkIns}
      </span>
      <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400" style={{ fontSize: 12 }}>
        Check-out: {checkOuts}
      </span>
      {nones > 0 && (
        <span className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 12 }}>
          {arabicSource("payroll.none_absence")} {nones}
        </span>
      )}
      {dateRange.length > 0 && (
        <span className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 12 }}>
          {arabicSource("common.from")} {dateRange[0]} {arabicSource("common.to")} {dateRange[dateRange.length - 1]}
        </span>
      )}
    </div>

    {unmatched.length > 0 && (
      <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
        <p className="text-amber-400 mb-1" style={{ fontSize: 13 }}>
          <TriangleAlert className="w-4 h-4 inline-block me-1" />
          {unmatched.length} {arabicSource("payroll.an_employee_that_does_not_match_the_system")}
        </p>
        <p className="text-amber-400/70" style={{ fontSize: 12 }}>
          IDs: {unmatched.join(", ")}
        </p>
      </div>
    )}
  </div>
);

export default UploadSummaryDetails;
