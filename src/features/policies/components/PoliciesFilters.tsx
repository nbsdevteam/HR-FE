import { arabicSource } from "@/i18n/source";
import { SearchInput, Select } from "@/shared/components";
import { policyCategories, policyStatusOptions } from "../constants/policies";
import type { PolicySortKey } from "../types";

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
        <button
          key={category}
          onClick={handleCategoryClick(category)}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
            selectedCategory === category ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
          style={{ fontSize: 13 }}
        >
          {category}
        </button>
      ))}
    </div>
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        {[arabicSource("common.all"), ...policyStatusOptions].map((status) => (
          <button
            key={status}
            onClick={handleStatusFilterClick(status)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === status ? "bg-primary/90 text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
            style={{ fontSize: 12 }}
          >
            {status}
          </button>
        ))}
      </div>
      <Select
        value={sortBy}
        onChange={handleSortChange}
        options={[
          { value: "updated", label: arabicSource("policies.latest_update") },
          { value: "title", label: arabicSource("common.address") },
          { value: "category", label: arabicSource("common.category") },
          { value: "status", label: arabicSource("common.status") },
        ]}
        className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm w-full sm:w-auto"
      />
    </div>
  </div>
  );
};

export default PoliciesFilters;
