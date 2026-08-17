import { Filter, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import TrainingFilterChip from "./TrainingFilterChip";

type TrainingFiltersBarProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filters: string[];
  filter: string;
  onFilterChange: (value: string) => void;
};

const TrainingFiltersBar = ({ searchTerm, onSearchTermChange, filters, filter, onFilterChange }: TrainingFiltersBarProps) => (
  <div className="flex items-center gap-4 flex-wrap">
    <div className="flex-1 min-w-64 relative">
      <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={arabicSource("training.searching_for_a_program")}
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full ps-4 pe-10 py-2 rounded-lg bg-card border border-border/40 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60"
      />
    </div>
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground" />
      {filters.map((f) => (
        <TrainingFilterChip key={f} label={f} isActive={filter === f} onClick={() => onFilterChange(f)} />
      ))}
    </div>
  </div>
);

export default TrainingFiltersBar;
