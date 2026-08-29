import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { FilterChip, SearchInput, Select } from "@/shared/components";
import { policyCategories, policyStatusOptions } from "../constants/policies";
import type { PolicySortKey } from "../types";

const POLICY_SORT_OPTIONS = [
  { value: "updated", label: arabicSource("policies.latest_update") },
  { value: "title", label: arabicSource("common.address") },
  { value: "category", label: arabicSource("common.category") },
  { value: "status", label: arabicSource("common.status") },
];

type PoliciesFiltersProps = {
  search: string;
  selectedCategory: string;
  sortBy: PolicySortKey;
  statusFilter: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sortBy: PolicySortKey) => void;
  onStatusFilterChange: (status: string) => void;
};

const PoliciesFilters = ({
  search,
  selectedCategory,
  sortBy,
  statusFilter,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
}: PoliciesFiltersProps) => {
  const handleCategoryClick = (category: string) => (): void => {
    onCategoryChange(category);
  };

  const handleStatusFilterClick = (status: string) => (): void => {
    onStatusFilterChange(status);
  };

  const handleSortChange = (value: string): void => {
    onSortChange(value as PolicySortKey);
  };

  const statusOptions = useMemo(
    () => [arabicSource("common.all"), ...policyStatusOptions],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={arabicSource("policies.policy_research")}
        inputClassName="w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
        {policyCategories.map((category) => (
          <FilterChip
            key={category}
            label={category}
            active={selectedCategory === category}
            onClick={handleCategoryClick(category)}
            fontSize={13}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <FilterChip
              key={status}
              label={status}
              active={statusFilter === status}
              onClick={handleStatusFilterClick(status)}
            />
          ))}
        </div>
        <Select
          value={sortBy}
          onChange={handleSortChange}
          options={POLICY_SORT_OPTIONS}
          className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm w-full sm:w-auto"
        />
      </div>
    </div>
  );
};

export default PoliciesFilters;
