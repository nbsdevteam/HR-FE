import { Filter } from "lucide-react";
import { FilterChip, SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

interface ITrainingFiltersBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filters: string[];
  filter: string;
  onFilterChange: (value: string) => void;
}

const TrainingFiltersBar = ({
  searchTerm,
  onSearchTermChange,
  filters,
  filter,
  onFilterChange,
}: ITrainingFiltersBarProps) => {
  const handleFilterClick = (value: string) => (): void => {
    onFilterChange(value);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <SearchInput
        wrapperClassName="flex-1 min-w-64 relative"
        iconClassName="absolute end-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
        inputClassName="w-full ps-4 pe-10 py-2 rounded-lg bg-card border border-border/40 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60"
        placeholder={arabicSource("training.searching_for_a_program")}
        value={searchTerm}
        onChange={onSearchTermChange}
      />
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters?.map((f) => (
          <FilterChip
            key={f}
            label={f}
            active={filter === f}
            onClick={handleFilterClick(f)}
            fontSize={13}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainingFiltersBar;
