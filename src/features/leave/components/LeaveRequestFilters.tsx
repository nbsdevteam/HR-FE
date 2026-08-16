import { Filter, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass } from "../styles";

type LeaveRequestFiltersProps = {
  filter: string;
  search: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
};

export const LeaveRequestFilters = ({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: LeaveRequestFiltersProps) => {
  const filters = [
    arabicSource("common.all"),
    arabicSource("common.pending"),
    arabicSource("common.accepted"),
    arabicSource("common.rejected_3"),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      {filters.map((filterOption) => (
        <button
          key={filterOption}
          onClick={() => onFilterChange(filterOption)}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filter === filterOption ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
          style={{ fontSize: 13 }}
        >
          {filterOption}
        </button>
      ))}
      <div className="relative flex-1 max-w-xs ms-auto">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={arabicSource("common.search")}
          className={`${leaveInputClass} ps-10`}
        />
      </div>
    </div>
  );
};
