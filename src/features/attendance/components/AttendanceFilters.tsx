import { ArrowUpDown, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AttendanceSortKey } from "../types";
import AttendanceFilterButton from "./AttendanceFilterButton";
import AttendanceSortButton from "./AttendanceSortButton";

type AttendanceFiltersProps = {
  searchTerm: string;
  statusFilter: string;
  sortBy: AttendanceSortKey;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: AttendanceSortKey) => void;
};

const AttendanceFilters = ({ searchTerm, statusFilter, sortBy, onSearchTermChange, onStatusFilterChange, onSortByChange }: AttendanceFiltersProps) => {
  return (
    <>
    {/* Search & Filters Bar */}
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input
          type="text"
          placeholder={arabicSource("attendance.search_by_name_fingerprint_number_or_department")}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full h-10 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          style={{ fontSize: 13 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        {[arabicSource("common.all"), arabicSource("common.present"), arabicSource("common.late"), arabicSource("common.absent"), arabicSource("common.leave")].map(f => (
          <AttendanceFilterButton
            key={f}
            label={f}
            active={statusFilter === f}
            onClick={() => onStatusFilterChange(f)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-s border-border/30 ps-3">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        {([
          { key: "checkIn" as const, label: arabicSource("common.time") },
          { key: "name" as const, label: arabicSource("common.name") },
          { key: "hours" as const, label: arabicSource("common.hours_2") },
        ]).map(s => (
          <AttendanceSortButton
            key={s.key}
            sortKey={s.key}
            label={s.label}
            active={sortBy === s.key}
            onClick={onSortByChange}
          />
        ))}
      </div>
    </div>


    </>
  );
}

export default AttendanceFilters;
