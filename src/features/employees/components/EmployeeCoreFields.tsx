import { useCallback } from "react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { todayInBaghdad } from "@/shared/utils/timezone";
import type { EmployeeAddForm, EmployeeOption } from "../types";
import type { EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import EmployeeManagerField from "./EmployeeManagerField";
import EmployeeTypeAheadField from "./EmployeeTypeAheadField";
import LabeledInput from "./LabeledInput";

const getDepartmentId = (d: DbDepartment): string => d.id;
const getDepartmentLabel = (d: DbDepartment): string => d.name;
const getDesignationId = (p: DbPosition): string => p.id;
const getDesignationLabel = (p: DbPosition): string =>
  p.title_ar || p.title_en || p.id;

type EmployeeCoreFieldsProps = {
  addForm: EmployeeAddForm;
  departmentOptions: DbDepartment[];
  designationOptions: DbPosition[];
  managerOptions: EmployeeOption[];
  birthDateError: string | null;
  fieldErrors: EmployeeFieldErrors;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
};

const EmployeeCoreFields = ({
  addForm,
  departmentOptions,
  designationOptions,
  managerOptions,
  birthDateError,
  fieldErrors,
  onFormChange,
}: EmployeeCoreFieldsProps) => {
  const handleNationalIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ nationalId: e.target.value }),
    [onFormChange],
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ email: e.target.value }),
    [onFormChange],
  );

  const handlePersonalPhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ personalPhone: e.target.value }),
    [onFormChange],
  );

  const handleCompanyPhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ companyPhone: e.target.value }),
    [onFormChange],
  );

  const handleDepartmentChange = useCallback(
    (value: string): void =>
      onFormChange({ departmentId: value, designationId: "" }),
    [onFormChange],
  );

  const handleDesignationChange = useCallback(
    (value: string): void => onFormChange({ designationId: value }),
    [onFormChange],
  );

  const handleManagerChange = useCallback(
    (value: string): void => onFormChange({ managerId: value }),
    [onFormChange],
  );

  const handleSalaryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ salary: e.target.value }),
    [onFormChange],
  );

  const handleBirthDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ birthDate: e.target.value }),
    [onFormChange],
  );

  const handleJoinDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ joinDate: e.target.value }),
    [onFormChange],
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <LabeledInput
        label={arabicSource("common.id_number")}
        type="text"
        value={addForm.nationalId}
        onChange={handleNationalIdChange}
        placeholder={arabicSource("employees.national_id_number")}
      />
      <LabeledInput
        label={arabicSource("common.email")}
        type="email"
        value={addForm.email}
        onChange={handleEmailChange}
        placeholder="example@company.iq"
      />
      <LabeledInput
        label={arabicSource("employees.personal_phone")}
        type="text"
        value={addForm.personalPhone}
        onChange={handlePersonalPhoneChange}
        placeholder="07XXXXXXXXX"
      />
      <LabeledInput
        label={arabicSource("common.company_phone")}
        type="text"
        value={addForm.companyPhone}
        onChange={handleCompanyPhoneChange}
        placeholder="07XXXXXXXXX"
      />
      <EmployeeTypeAheadField
        label={arabicSource("common.section")}
        items={departmentOptions}
        getId={getDepartmentId}
        getLabel={getDepartmentLabel}
        value={addForm.departmentId}
        onChange={handleDepartmentChange}
        placeholder={arabicSource("employees.select_the_section")}
        error={fieldErrors.department}
      />
      <EmployeeTypeAheadField
        label={arabicSource("employees.job_position")}
        items={designationOptions}
        getId={getDesignationId}
        getLabel={getDesignationLabel}
        value={addForm.designationId}
        onChange={handleDesignationChange}
        placeholder={arabicSource("common.select")}
        error={fieldErrors.designation}
      />
      <EmployeeManagerField
        managerId={addForm.managerId}
        managerOptions={managerOptions}
        onChange={handleManagerChange}
      />
      <LabeledInput
        label={arabicSource("employees.salary_iqd")}
        type="number"
        value={addForm.salary}
        onChange={handleSalaryChange}
        placeholder="0"
        dir="ltr"
      />
      <LabeledInput
        label={arabicSource("common.birth_date")}
        type="date"
        value={addForm.birthDate}
        onChange={handleBirthDateChange}
        max={todayInBaghdad()}
        error={birthDateError}
        dir="ltr"
        addedContainerClasses="w-full col-span-2"
        addedInputClasses="w-full block"
      />
      <LabeledInput
        label={arabicSource("common.direct_date")}
        type="date"
        value={addForm.joinDate}
        onChange={handleJoinDateChange}
        max={todayInBaghdad()}
        dir="ltr"
        addedContainerClasses="w-full col-span-2"
        addedInputClasses="w-full block"
      />
    </div>
  );
};

export default EmployeeCoreFields;
