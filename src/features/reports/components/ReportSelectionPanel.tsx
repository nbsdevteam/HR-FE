import { useState, useMemo, useCallback } from "react";
import { arabicSource } from "@/i18n/source";
import { Button, SearchInput } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { employeeInitials } from "../utils/employeeInitials";
import type { ReportField, ReportSelectionTabId } from "../types";
import ReportSelectionGrid from "./ReportSelectionGrid";
import ReportSelectionTab from "./ReportSelectionTab";

type ReportSelectionPanelProps = {
  employees: DbEmployee[];
  selectedEmployeeIds: string[];
  fields: ReportField[];
  selectedFieldKeys: string[];
  fieldsLoading: boolean;
  /** Only reports with a backend field catalogue can pick their own columns. */
  showColumns: boolean;
  onSelectedEmployeeIdsChange: (ids: string[]) => void;
  onToggleField: (key: string) => void;
  onSelectAllFields: () => void;
  onClearAllFields: () => void;
};

const SEARCH_INPUT_CLASS =
  "w-full ps-9 pe-3 py-2 rounded-lg bg-input border border-border/50 text-foreground outline-none placeholder:text-muted-foreground";

/**
 * Employees and columns pickers merged into one tabbed section, replacing the
 * standalone employee dropdown that used to sit outside the report modal.
 */
const ReportSelectionPanel = ({
  employees,
  selectedEmployeeIds,
  fields,
  selectedFieldKeys,
  fieldsLoading,
  showColumns,
  onSelectedEmployeeIdsChange,
  onToggleField,
  onSelectAllFields,
  onClearAllFields,
}: ReportSelectionPanelProps) => {
  const [activeTab, setActiveTab] = useState<ReportSelectionTabId>("employees");
  const [employeeQuery, setEmployeeQuery] = useState("");

  const isEmployeesTab = activeTab === "employees" || !showColumns;

  const employeeItems = useMemo(
    () =>
      employees.map((employee) => {
        const label = empDisplayName(employee);
        return { value: employee.id, label, initials: employeeInitials(label) };
      }),
    [employees],
  );

  const visibleEmployeeItems = useMemo(() => {
    const query = employeeQuery.trim().toLowerCase();
    if (!query) return employeeItems;
    return employeeItems.filter((item) => item.label.toLowerCase().includes(query));
  }, [employeeItems, employeeQuery]);

  const fieldItems = useMemo(
    () => fields.map((field) => ({ value: field.key, label: field.label })),
    [fields],
  );

  const handleClearQuery = useCallback((): void => setEmployeeQuery(""), []);

  const handleToggleEmployee = useCallback(
    (id: string): void => {
      onSelectedEmployeeIdsChange(
        selectedEmployeeIds.includes(id)
          ? selectedEmployeeIds.filter((selectedId) => selectedId !== id)
          : [...selectedEmployeeIds, id],
      );
    },
    [onSelectedEmployeeIdsChange, selectedEmployeeIds],
  );

  const handleSelectAll = useCallback((): void => {
    if (!isEmployeesTab) {
      onSelectAllFields();
      return;
    }
    const next = new Set(selectedEmployeeIds);
    visibleEmployeeItems.forEach((item) => next.add(item.value));
    onSelectedEmployeeIdsChange([...next]);
  }, [
    isEmployeesTab,
    onSelectAllFields,
    onSelectedEmployeeIdsChange,
    selectedEmployeeIds,
    visibleEmployeeItems,
  ]);

  const handleClear = useCallback((): void => {
    if (!isEmployeesTab) {
      onClearAllFields();
      return;
    }
    const visible = new Set(visibleEmployeeItems.map((item) => item.value));
    onSelectedEmployeeIdsChange(selectedEmployeeIds.filter((id) => !visible.has(id)));
  }, [
    isEmployeesTab,
    onClearAllFields,
    onSelectedEmployeeIdsChange,
    selectedEmployeeIds,
    visibleEmployeeItems,
  ]);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <ReportSelectionTab
          id="employees"
          label={arabicSource("common.employees")}
          count={selectedEmployeeIds.length}
          active={isEmployeesTab}
          onSelect={setActiveTab}
        />
        {showColumns && (
          <ReportSelectionTab
            id="columns"
            label={arabicSource("reports.columns")}
            count={selectedFieldKeys.length}
            active={!isEmployeesTab}
            onSelect={setActiveTab}
          />
        )}
      </div>

      {isEmployeesTab && (
        <SearchInput
          value={employeeQuery}
          onChange={setEmployeeQuery}
          onClear={handleClearQuery}
          placeholder={arabicSource("common.search_for_an_employee")}
          inputClassName={SEARCH_INPUT_CLASS}
          style={{ fontSize: 13 }}
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          {arabicSource("common.select_all")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="border border-border/50"
        >
          {arabicSource("common.clear_all")}
        </Button>
      </div>

      {!isEmployeesTab && !fieldsLoading && selectedFieldKeys.length === 0 && (
        <p className="text-destructive" style={{ fontSize: 11 }}>
          {arabicSource("reports.select_at_least_one_field")}
        </p>
      )}

      <div className="max-h-[300px] overflow-y-auto pe-1">
        {isEmployeesTab ? (
          <ReportSelectionGrid
            items={visibleEmployeeItems}
            selectedValues={selectedEmployeeIds}
            onToggle={handleToggleEmployee}
          />
        ) : fieldsLoading ? (
          <p className="text-muted-foreground text-center py-6" style={{ fontSize: 12 }}>
            {arabicSource("common.loading")}
          </p>
        ) : (
          <ReportSelectionGrid
            items={fieldItems}
            selectedValues={selectedFieldKeys}
            onToggle={onToggleField}
          />
        )}
      </div>
    </div>
  );
};

export default ReportSelectionPanel;
