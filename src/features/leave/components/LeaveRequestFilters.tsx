import { Filter, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass } from "../styles";
import LeaveRequestFilterChip from "./LeaveRequestFilterChip";

type LeaveRequestFiltersProps = {
  filter: string;
  search: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
};

// Module scope — the option list is static, so it should not be rebuilt per render.
const LEAVE_STATUS_FILTERS = [
  arabicSource("common.all"),
  arabicSource("common.pending"),
  arabicSource("common.accepted"),
  arabicSource("common.rejected_3"),
];

const LeaveRequestFilters = ({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: LeaveRequestFiltersProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      {LEAVE_STATUS_FILTERS.map((filterOption) => (
        <LeaveRequestFilterChip
          key={filterOption}
          label={filterOption}
          active={filter === filterOption}
          onSelect={onFilterChange}
        />
      ))}
      <div className="relative flex-1 max-w-xs ms-auto">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={arabicSource("common.search")}
          className={`${leaveInputClass} ps-10`}
        />
      </div>
    </div>
  );
};

export default LeaveRequestFilters;
