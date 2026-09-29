import { useCallback } from "react";
import { Filter } from "lucide-react";
import { MultiSelect, SearchInput, Select } from "@/shared/components";
import type { MultiSelectItem } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DeviceEnrollmentState, EmployeeOriginFilter, EmployeeStatusCode } from "@/shared/hooks";

const SEARCH_INPUT_CLASS =
  "w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

const STATUS_OPTIONS = [
  { value: "active", label: arabicSource("employees.status_active") },
  { value: "inactive", label: arabicSource("employees.status_inactive") },
  { value: "suspended", label: arabicSource("employees.status_suspended") },
  { value: "onboarding", label: arabicSource("employees.status_onboarding") },
  { value: "exited", label: arabicSource("employees.status_exited") },
];

const DEVICE_ENROLLMENT_STATE_OPTIONS: MultiSelectItem[] = [
  { value: "pending", label: arabicSource("employees.device_enrollment_pending") },
  { value: "partial", label: arabicSource("employees.device_enrollment_partial") },
  { value: "enrolled", label: arabicSource("employees.device_enrollment_enrolled") },
  { value: "failed", label: arabicSource("employees.device_enrollment_failed") },
  { value: "removal_pending", label: arabicSource("employees.device_enrollment_removal_pending") },
  { value: "removal_failed", label: arabicSource("employees.device_enrollment_removal_failed") },
  { value: "removed", label: arabicSource("employees.device_enrollment_removed") },
];

const ORIGIN_OPTIONS = [
  { value: "hr_info_pending", label: arabicSource("employees.origin_hr_info_pending") },
  { value: "device", label: arabicSource("employees.origin_device") },
];

type EmployeesFiltersProps = {
  search: string;
  selectedDept: string;
  departments: string[];
  status: EmployeeStatusCode | "";
  deviceEnrollmentState: DeviceEnrollmentState[];
  origin: EmployeeOriginFilter;
  onSearchChange: (search: string) => void;
  onDepartmentChange: (department: string) => void;
  onStatusChange: (status: EmployeeStatusCode | "") => void;
  onDeviceEnrollmentStateChange: (states: DeviceEnrollmentState[]) => void;
  onOriginChange: (origin: EmployeeOriginFilter) => void;
};

const EmployeesFilters = ({
  search,
  selectedDept,
  departments,
  status,
  deviceEnrollmentState,
  origin,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
  onDeviceEnrollmentStateChange,
  onOriginChange,
}: EmployeesFiltersProps) => {
  const handleDepartmentChange = useCallback(
    (value: string): void => {
      onDepartmentChange(value);
    },
    [onDepartmentChange],
  );

  const handleStatusChange = useCallback(
    (value: string): void => {
      onStatusChange(value as EmployeeStatusCode | "");
    },
    [onStatusChange],
  );

  const handleDeviceEnrollmentStateChange = useCallback(
    (values: string[]): void => {
      onDeviceEnrollmentStateChange(values as DeviceEnrollmentState[]);
    },
    [onDeviceEnrollmentStateChange],
  );

  const handleOriginChange = useCallback(
    (value: string): void => {
      onOriginChange(value as EmployeeOriginFilter);
    },
    [onOriginChange],
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={arabicSource("common.search_for_an_employee")}
        wrapperClassName="relative flex-1 min-w-[250px]"
        iconClassName="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground"
        inputClassName={SEARCH_INPUT_CLASS}
      />
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select
          value={selectedDept}
          onChange={handleDepartmentChange}
          options={departments}
          aria-label={arabicSource("common.section")}
          className="w-48"
          style={{ height: 38 }}
        />
      </div>
      <Select
        value={status}
        onChange={handleStatusChange}
        options={STATUS_OPTIONS}
        blankLabel={arabicSource("common.all")}
        aria-label={arabicSource("common.status")}
        className="w-40"
        style={{ height: 38 }}
      />
      <MultiSelect
        items={DEVICE_ENROLLMENT_STATE_OPTIONS}
        selectedValues={deviceEnrollmentState}
        onChange={handleDeviceEnrollmentStateChange}
        placeholder={arabicSource("employees.device_enrollment_state_filter_label")}
        className="w-56"
      />
      <Select
        value={origin}
        onChange={handleOriginChange}
        options={ORIGIN_OPTIONS}
        blankLabel={arabicSource("common.all")}
        aria-label={arabicSource("employees.origin_filter_label")}
        className="w-60"
        style={{ height: 38 }}
      />
    </div>
  );
};

export default EmployeesFilters;
