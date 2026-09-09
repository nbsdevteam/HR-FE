import { useCallback } from "react";
import { motion } from "motion/react";
import {
  Mail, Wallet, CalendarCheck, CalendarX,
  Hash, PhoneCall, Smartphone, FileText, ClipboardList, Users,
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { DatePicker, Select, TypeAhead } from "@/shared/components";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import type { DepartmentOption, Employee, EmployeeOption, PositionOption } from "../types";
import type { EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import EmployeeAddressFields from "./EmployeeAddressFields";
import EmployeeBirthDateField from "./EmployeeBirthDateField";
import EmployeeDepartmentField from "./EmployeeDepartmentField";
import EmployeeEmergencyContactField from "./EmployeeEmergencyContactField";
import EmployeeFieldRow from "./EmployeeFieldRow";
import EmployeeInputFieldRow from "./EmployeeInputFieldRow";
import EmployeePositionField from "./EmployeePositionField";

const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";
const getManagerOptionId = (emp: EmployeeOption): string => emp.dbId;
const getManagerOptionLabel = (emp: EmployeeOption): string => `${emp.name} (${emp.position})`;

type EmployeeInfoTabProps = {
  editData: Employee;
  isEditing: boolean;
  allDepts: DepartmentOption[];
  departmentId: string | null;
  allPositions: PositionOption[];
  positionId: string | null;
  allEmployees: EmployeeOption[];
  addingNewDept: boolean;
  creatingDept: boolean;
  newDeptName: string;
  locationCountries: GeoCountry[];
  locationStates: GeoState[];
  locationCities: GeoCity[];
  loadingLocationCountries: boolean;
  loadingLocationStates: boolean;
  loadingLocationCities: boolean;
  locationCitySuggestions: GeoCity[];
  creatingLocationCity: boolean;
  locationCityCreateError: string | null;
  birthDateError: string | null;
  fieldErrors: EmployeeFieldErrors;
  onFieldChange: (field: keyof Employee, value: string | number) => void;
  onDepartmentSelect: (deptId: string, deptName: string) => void;
  onPositionSelect: (positionId: string, positionName: string) => void;
  onManagerChange: (managerId: string | null) => void;
  onStartAddingDept: () => void;
  onNewDeptNameChange: (value: string) => void;
  onConfirmNewDept: () => void;
  onCancelNewDept: () => void;
  onLocationCountryChange: (value: string) => void;
  onLocationStateChange: (value: string) => void;
  onLocationCitySearch: (query: string) => void;
  onAddLocationCity: (name: string) => Promise<GeoCity | null>;
  onConfirmAddLocationCity: () => Promise<GeoCity | null>;
  onDismissLocationCitySuggestions: () => void;
};

const EmployeeInfoTab = ({
  editData,
  isEditing,
  allDepts,
  departmentId,
  allPositions,
  positionId,
  allEmployees,
  addingNewDept,
  creatingDept,
  newDeptName,
  locationCountries,
  locationStates,
  locationCities,
  loadingLocationCountries,
  loadingLocationStates,
  loadingLocationCities,
  locationCitySuggestions,
  creatingLocationCity,
  locationCityCreateError,
  birthDateError,
  fieldErrors,
  onFieldChange,
  onDepartmentSelect,
  onPositionSelect,
  onManagerChange,
  onStartAddingDept,
  onNewDeptNameChange,
  onConfirmNewDept,
  onCancelNewDept,
  onLocationCountryChange,
  onLocationStateChange,
  onLocationCitySearch,
  onAddLocationCity,
  onConfirmAddLocationCity,
  onDismissLocationCitySuggestions,
}: EmployeeInfoTabProps) => {
  const handleEmployeeNumberChange = useCallback(
    (value: string): void => onFieldChange("employeeNumber", value),
    [onFieldChange],
  );

  const handleEmailChange = useCallback(
    (value: string): void => onFieldChange("email", value),
    [onFieldChange],
  );

  const handlePersonalPhoneChange = useCallback(
    (value: string): void => onFieldChange("personalPhone", value),
    [onFieldChange],
  );

  const handleCompanyPhoneChange = useCallback(
    (value: string): void => onFieldChange("companyPhone", value),
    [onFieldChange],
  );

  const handleSalaryChange = useCallback(
    (value: string): void => onFieldChange("salary", Number(value)),
    [onFieldChange],
  );

  const handleNationalIdChange = useCallback(
    (value: string): void => onFieldChange("nationalId", value),
    [onFieldChange],
  );

  const handleStartDateChange = (value: string): void => {
    onFieldChange("startDate", value);
  };

  const handleEndDateChange = (value: string): void => {
    onFieldChange("endDate", value);
  };

  const handleBloodTypeChange = (value: string): void => {
    onFieldChange("bloodType", value);
  };

  const handleManagerChange = (value: string): void => {
    onManagerChange(value || null);
  };

  return (
    <motion.div
      key="info"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="px-6 py-4"
    >
      <EmployeeInputFieldRow
        icon={Hash} label={arabicSource("common.job_number")} value={editData.employeeNumber}
        inputValue={editData.employeeNumber} isEditing={isEditing} onChange={handleEmployeeNumberChange}
      />
      <EmployeeDepartmentField
        department={editData.department}
        departmentId={departmentId}
        allDepts={allDepts}
        isEditing={isEditing}
        addingNewDept={addingNewDept}
        creatingDept={creatingDept}
        newDeptName={newDeptName}
        inputClass={inputClass}
        onSelectDepartment={onDepartmentSelect}
        onStartAddingDept={onStartAddingDept}
        onNewDeptNameChange={onNewDeptNameChange}
        onConfirmNewDept={onConfirmNewDept}
        onCancelNewDept={onCancelNewDept}
        error={fieldErrors.department}
      />
      <EmployeePositionField
        position={editData.position}
        positionId={positionId}
        allPositions={allPositions}
        isEditing={isEditing}
        inputClass={inputClass}
        error={fieldErrors.designation}
        onSelectPosition={onPositionSelect}
      />
      <EmployeeInputFieldRow
        icon={Mail} label={arabicSource("common.email")} value={editData.email}
        inputValue={editData.email} isEditing={isEditing} onChange={handleEmailChange}
      />
      <EmployeeInputFieldRow
        icon={Smartphone} label={arabicSource("shared.employee_phone")} value={editData.personalPhone || "—"}
        inputValue={editData.personalPhone} isEditing={isEditing} onChange={handlePersonalPhoneChange}
      />
      <EmployeeInputFieldRow
        icon={PhoneCall} label={arabicSource("common.company_phone")} value={editData.companyPhone || "—"}
        inputValue={editData.companyPhone} isEditing={isEditing} onChange={handleCompanyPhoneChange}
      />
      <EmployeeAddressFields
        editData={editData}
        isEditing={isEditing}
        countries={locationCountries}
        states={locationStates}
        cities={locationCities}
        loadingCountries={loadingLocationCountries}
        loadingStates={loadingLocationStates}
        loadingCities={loadingLocationCities}
        citySuggestions={locationCitySuggestions}
        creatingCity={creatingLocationCity}
        cityCreateError={locationCityCreateError}
        onFieldChange={onFieldChange}
        onCountryChange={onLocationCountryChange}
        onStateChange={onLocationStateChange}
        onCitySearch={onLocationCitySearch}
        onAddCity={onAddLocationCity}
        onConfirmAddCity={onConfirmAddLocationCity}
        onDismissCitySuggestions={onDismissLocationCitySuggestions}
      />
      <EmployeeInputFieldRow
        icon={Wallet} label={arabicSource("common.salary")} value={formatCurrency(editData.salary, editData.currency || "IQD")}
        inputValue={editData.salary} type="number" highlight isEditing={isEditing} onChange={handleSalaryChange}
      />
      <EmployeeFieldRow
        icon={CalendarCheck} iconColor="text-emerald-400" label={arabicSource("common.direct_date")} value={editData.startDate}
        dir="ltr" isEditing={isEditing}
        editElement={
          <DatePicker value={editData.startDate} onChange={handleStartDateChange} maxDate={todayInBaghdad()} />
        }
      />
      <EmployeeFieldRow
        icon={CalendarX} iconColor="text-destructive" label={arabicSource("shared.departure_date")}
        value={editData.endDate || arabicSource("shared.still_working")}
        dir="ltr" isEditing={isEditing}
        editElement={
          <DatePicker value={editData.endDate || ""} onChange={handleEndDateChange} />
        }
      />
      <EmployeeInputFieldRow
        icon={FileText} label={arabicSource("common.id_number")} value={editData.nationalId || "—"}
        inputValue={editData.nationalId} isEditing={isEditing} onChange={handleNationalIdChange}
      />
      <EmployeeBirthDateField
        birthDate={editData.birthDate}
        isEditing={isEditing}
        error={birthDateError}
        onFieldChange={onFieldChange}
      />
      <EmployeeEmergencyContactField
        editData={editData}
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
      <EmployeeFieldRow
        icon={ClipboardList} iconColor="text-destructive" label={arabicSource("shared.blood_type")} value={editData.bloodType || "—"} dir="ltr"
        isEditing={isEditing}
        editElement={
          <Select
            value={editData.bloodType}
            onChange={handleBloodTypeChange}
            options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            className={inputClass}
            style={{ fontSize: 14 }}
            openUpward
          />
        }
      />
      <EmployeeFieldRow
        icon={Users} iconColor="text-primary" label={arabicSource("common.direct_manager")} value={editData.managerName}
        isEditing={isEditing}
        editElement={
          <TypeAhead
            items={allEmployees}
            getId={getManagerOptionId}
            getLabel={getManagerOptionLabel}
            value={editData.managerId || ""}
            onChange={handleManagerChange}
            blankLabel={arabicSource("shared.without_a_direct_manager")}
            openUpward
          />
        }
      />
    </motion.div>
  );
};

export default EmployeeInfoTab;
