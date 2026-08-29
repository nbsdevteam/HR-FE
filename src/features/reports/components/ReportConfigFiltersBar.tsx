import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button, SearchInput, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ReportTemplateMetadata } from "@/shared/hooks";

type ReportConfigFiltersBarProps = {
  search: string;
  category: string;
  includeArchived: boolean;
  metadata: ReportTemplateMetadata | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onIncludeArchivedToggle: () => void;
  onNewConfiguration: () => void;
};

const ReportConfigFiltersBar = ({
  search,
  category,
  includeArchived,
  metadata,
  onSearchChange,
  onCategoryChange,
  onIncludeArchivedToggle,
  onNewConfiguration,
}: ReportConfigFiltersBarProps) => {
  const categoryOptions = useMemo(
    () => [{ value: "all", label: arabicSource("reports.all_categories") }, ...(metadata?.categories || [])],
    [metadata],
  );

  const handleClearSearch = useCallback((): void => onSearchChange(""), [onSearchChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        onClear={handleClearSearch}
        placeholder={arabicSource("reports.search_configurations")}
        wrapperClassName="relative flex-1 min-w-[220px]"
        inputClassName="w-full h-11 ps-9 pe-4 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <Select
        value={category}
        onChange={onCategoryChange}
        options={categoryOptions}
        className="w-44 h-11 px-4"
      />
      <Button
        variant="toggle"
        active={includeArchived}
        onClick={onIncludeArchivedToggle}
      >
        {arabicSource("reports.include_archived")}
      </Button>
      <Button variant="primary" icon={Plus} onClick={onNewConfiguration}>
        {arabicSource("reports.new_configuration")}
      </Button>
    </div>
  );
};

export default ReportConfigFiltersBar;
