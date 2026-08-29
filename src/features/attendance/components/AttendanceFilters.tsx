import { ArrowUpDown } from "lucide-react";
import { SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { AttendanceSortKey } from "../types";
import { attendanceStatusFilterOptions, attendanceSortOptions } from "../data";
import AttendanceSortButton from "./AttendanceSortButton";
import AttendanceStatusFilterChip from "./AttendanceStatusFilterChip";

type AttendanceFiltersProps = {
  searchTerm: string;
  statusFilter: string;
  sortBy: AttendanceSortKey;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: AttendanceSortKey) => void;
};

const AttendanceFilters = ({
  searchTerm,
  statusFilter,
  sortBy,
  onSearchTermChange,
  onStatusFilterChange,
  onSortByChange,
}: AttendanceFiltersProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <SearchInput
      wrapperClassName="relative flex-1 min-w-[200px]"
      iconClassName="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground"
      inputClassName="w-full h-10 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      placeholder={arabicSource("attendance.search_by_name_fingerprint_number_or_department")}
      value={searchTerm}
      onChange={onSearchTermChange}
      style={{ fontSize: 13 }}
    />
    <div className="flex items-center gap-1.5">
      {attendanceStatusFilterOptions.map((option) => (
        <AttendanceStatusFilterChip
          key={option}
          label={option}
          active={statusFilter === option}
          onSelect={onStatusFilterChange}
        />
      ))}
    </div>
    <div className="flex items-center gap-1.5 border-s border-border/30 ps-3">
      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
      {attendanceSortOptions.map((option) => (
        <AttendanceSortButton
          key={option.key}
          sortKey={option.key}
          label={option.label}
          active={sortBy === option.key}
          onClick={onSortByChange}
        />
      ))}
    </div>
  </div>
);

export default AttendanceFilters;
