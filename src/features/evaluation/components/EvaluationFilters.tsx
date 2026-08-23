import { memo } from "react";
import { Search } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { evaluationInputClass } from "../styles";

const STATUS_OPTIONS = [
  arabicSource("common.all"),
  arabicSource("common.complete"),
  arabicSource("common.under_evaluation"),
  arabicSource("common.did_not_start"),
];

type EvaluationFiltersProps = {
  searchText: string;
  filterStatus: string;
  onSearchTextChange: (searchText: string) => void;
  onFilterStatusChange: (filterStatus: string) => void;
};

const EvaluationFilters = ({
  searchText,
  filterStatus,
  onSearchTextChange,
  onFilterStatusChange,
}: EvaluationFiltersProps) => {
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchTextChange(e.target.value);
  };

  const handleFilterStatusChange = (value: string): void => {
    onFilterStatusChange(value);
  };

  return (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
      <Search className="w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={searchText}
        onChange={handleSearchTextChange}
        placeholder={arabicSource("evaluation.search_by_name_or_period")}
        className={`${evaluationInputClass} flex-1`}
        style={{ height: 38 }}
      />
    </div>
    <Select
      value={filterStatus}
      onChange={handleFilterStatusChange}
      options={STATUS_OPTIONS}
      aria-label={arabicSource("common.status")}
      className={evaluationInputClass}
      style={{ width: 160, height: 38 }}
    />
  </div>
  );
};

export default memo(EvaluationFilters);
