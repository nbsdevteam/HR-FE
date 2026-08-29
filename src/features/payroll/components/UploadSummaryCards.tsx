import { CalendarDays, FileText, UserCheck, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import UploadSummaryCard from "./UploadSummaryCard";

type UploadSummaryCardsProps = {
  totalRecords: number;
  uniqueEmployees: number;
  uniqueDates: number;
  matchedCount: number;
};

const UploadSummaryCards = ({ totalRecords, uniqueEmployees, uniqueDates, matchedCount }: UploadSummaryCardsProps) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <UploadSummaryCard label={arabicSource("common.total_records")} value={totalRecords} icon={FileText} />
    <UploadSummaryCard label={arabicSource("common.number_of_employees")} value={uniqueEmployees} icon={Users} />
    <UploadSummaryCard label={arabicSource("payroll.number_of_days")} value={uniqueDates} icon={CalendarDays} />
    <UploadSummaryCard label={arabicSource("payroll.are_identical_to_the_system")} value={matchedCount} icon={UserCheck} />
  </div>
);

export default UploadSummaryCards;
