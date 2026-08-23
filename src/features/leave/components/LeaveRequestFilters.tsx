import { Filter, Search } from "lucide-react";
import { FilterChip } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass } from "../styles";

type LeaveRequestFiltersProps = {
  filter: string;
  search: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
};

const LeaveRequestFilters = ({
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

  const handleFilterClick = (filterOption: string) => (): void => {
    onFilterChange(filterOption);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      {filters.map((filterOption) => (
        <FilterChip
          key={filterOption}
          label={filterOption}
          active={filter === filterOption}
          onClick={handleFilterClick(filterOption)}
          fontSize={13}
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
