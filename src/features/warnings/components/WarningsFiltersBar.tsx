import { motion } from "motion/react";
import { Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type WarningsFiltersBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  warningTypes: string[];
  warningStatuses: string[];
};

const WarningsFiltersBar = ({
  searchQuery,
  onSearchQueryChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  warningTypes,
  warningStatuses,
}: WarningsFiltersBarProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg"
  >
    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={arabicSource("warnings.find_an_employee_or_cause")}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full h-11 px-4 pe-10 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>

      <select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value)}
        className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      >
        <option value="">{arabicSource("common.all_types")}</option>
        {warningTypes.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={filterStatus}
        onChange={(e) => onFilterStatusChange(e.target.value)}
        className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      >
        <option value="">{arabicSource("warnings.all_cases")}</option>
        {warningStatuses.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  </motion.div>
);

export default WarningsFiltersBar;
