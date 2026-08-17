import { Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
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

export const PoliciesFilters = ({
  search,
  selectedCategory,
  sortBy,
  statusFilter,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
}: PoliciesFiltersProps) => (
  <div className="flex flex-col gap-4">
    <div className="relative">
      <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
      <input
        type="text"
        placeholder={arabicSource("policies.policy_research")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>
    <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
      {policyCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
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
            onClick={() => onStatusFilterChange(status)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === status ? "bg-primary/90 text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
            style={{ fontSize: 12 }}
          >
            {status}
          </button>
        ))}
      </div>
      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as PolicySortKey)}
        className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm w-full sm:w-auto"
      >
        <option value="updated">{arabicSource("policies.latest_update")}</option>
        <option value="title">{arabicSource("common.address")}</option>
        <option value="category">{arabicSource("common.category")}</option>
        <option value="status">{arabicSource("common.status")}</option>
      </select>
    </div>
  </div>
);
