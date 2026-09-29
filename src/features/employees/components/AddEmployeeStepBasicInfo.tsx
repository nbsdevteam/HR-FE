import type { ChangeEvent } from "react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm, EmployeeOption } from "../types";
import type { EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import EmployeeCoreFields from "./EmployeeCoreFields";
import EmployeeLocationFields from "./EmployeeLocationFields";
import LabeledInput from "./LabeledInput";

type AddEmployeeStepBasicInfoProps = {
  addForm: EmployeeAddForm;
  birthDateError: string | null;
  fieldErrors: EmployeeFieldErrors;
  departmentOptions: DbDepartment[];
  designationOptions: DbPosition[];
  managerOptions: EmployeeOption[];
  countries: GeoCountry[];
  states: GeoState[];
  cities: GeoCity[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  citySuggestions: GeoCity[];
  creatingCity: boolean;
  cityCreateError: string | null;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCitySearch: (query: string) => void;
  onAddCity: (name: string) => Promise<GeoCity | null>;
  onConfirmAddCity: () => Promise<GeoCity | null>;
  onDismissCitySuggestions: () => void;
};

const AddEmployeeStepBasicInfo = ({
  addForm,
  birthDateError,
  fieldErrors,
  departmentOptions,
  designationOptions,
  managerOptions,
  countries,
  states,
  cities,
  loadingCountries,
  loadingStates,
  loadingCities,
  citySuggestions,
  creatingCity,
  cityCreateError,
  onFormChange,
  onCountryChange,
  onStateChange,
  onCityChange,
  onCitySearch,
  onAddCity,
  onConfirmAddCity,
  onDismissCitySuggestions,
}: AddEmployeeStepBasicInfoProps) => {
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ name: e.target.value });
  };

  return (
    <div className="space-y-3">
      <LabeledInput
        label={arabicSource("common.full_name")}
        type="text"
        value={addForm.name}
        onChange={handleNameChange}
        placeholder={arabicSource("employees.enter_the_employee_s_name")}
      />
      <EmployeeCoreFields
        addForm={addForm}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        managerOptions={managerOptions}
        birthDateError={birthDateError}
        fieldErrors={fieldErrors}
        onFormChange={onFormChange}
      />
      <EmployeeLocationFields
        addForm={addForm}
        countries={countries}
        states={states}
        cities={cities}
        loadingCountries={loadingCountries}
        loadingStates={loadingStates}
        loadingCities={loadingCities}
        citySuggestions={citySuggestions}
        creatingCity={creatingCity}
        cityCreateError={cityCreateError}
        onFormChange={onFormChange}
        onCountryChange={onCountryChange}
        onStateChange={onStateChange}
        onCityChange={onCityChange}
        onCitySearch={onCitySearch}
        onAddCity={onAddCity}
        onConfirmAddCity={onConfirmAddCity}
        onDismissCitySuggestions={onDismissCitySuggestions}
      />
    </div>
  );
};

export default AddEmployeeStepBasicInfo;
