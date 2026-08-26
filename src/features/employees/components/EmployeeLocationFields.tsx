import { useCallback } from "react";
import { TypeAhead, Select } from "@/shared/components";
import type { CountryOption } from "@/shared/api/locationData";
import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm, WorkLocation } from "../types";
import LabeledInput from "./LabeledInput";

const stringIdentity = (value: string): string => value;
const getCountryId = (country: CountryOption): string => country.name;
const getCountryLabel = (country: CountryOption): string => country.name;
const getNationalityId = (country: CountryOption): string => country.nationality;
const getNationalityLabel = (country: CountryOption): string => country.nationality;
const fieldLabelClass = "text-foreground block mb-1.5";

type EmployeeLocationFieldsProps = {
  addForm: EmployeeAddForm;
  countries: CountryOption[];
  states: string[];
  cities: string[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
};

const EmployeeLocationFields = ({
  addForm,
  countries,
  states,
  cities,
  loadingCountries,
  loadingStates,
  loadingCities,
  onFormChange,
  onCountryChange,
  onStateChange,
}: EmployeeLocationFieldsProps) => {
  const handleNationalityChange = useCallback(
    (value: string): void => onFormChange({ nationality: value }),
    [onFormChange],
  );

  const handleCityChange = useCallback(
    (value: string): void => onFormChange({ city: value }),
    [onFormChange],
  );

  const handleResidenceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      onFormChange({ residence: e.target.value }),
    [onFormChange],
  );

  const handleWorkLocationChange = useCallback(
    (value: string): void => onFormChange({ workLocation: value as WorkLocation }),
    [onFormChange],
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("employees.nationality")}
        </label>
        <TypeAhead
          items={countries}
          getId={getNationalityId}
          getLabel={getNationalityLabel}
          value={addForm.nationality}
          onChange={handleNationalityChange}
          placeholder={arabicSource(
            loadingCountries ? "common.loading" : "employees.select_the_nationality",
          )}
          openUpward
        />
      </div>
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("employees.country")}
        </label>
        <TypeAhead
          items={countries}
          getId={getCountryId}
          getLabel={getCountryLabel}
          value={addForm.country}
          onChange={onCountryChange}
          placeholder={arabicSource(
            loadingCountries ? "common.loading" : "employees.select_the_country",
          )}
          openUpward
        />
      </div>
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("employees.state")}
        </label>
        <TypeAhead
          items={states}
          getId={stringIdentity}
          getLabel={stringIdentity}
          value={addForm.state}
          onChange={onStateChange}
          placeholder={arabicSource(
            loadingStates ? "common.loading" : "employees.select_the_state",
          )}
          disabled={!addForm.country}
          openUpward
        />
      </div>
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("common.city")}
        </label>
        <TypeAhead
          items={cities}
          getId={stringIdentity}
          getLabel={stringIdentity}
          value={addForm.city}
          onChange={handleCityChange}
          placeholder={arabicSource(
            loadingCities ? "common.loading" : "employees.select_the_city",
          )}
          disabled={!addForm.state}
          openUpward
        />
      </div>
      <LabeledInput
        label={arabicSource("employees.residence")}
        type="text"
        value={addForm.residence}
        onChange={handleResidenceChange}
        placeholder={arabicSource("employees.enter_the_residence")}
      />
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("employees.work_location")}
        </label>
        <Select
          value={addForm.workLocation}
          onChange={handleWorkLocationChange}
          placeholder={arabicSource("employees.select_the_work_location")}
          options={[
            { value: "local", label: arabicSource("employees.work_location_local") },
            { value: "remote", label: arabicSource("employees.work_location_remote") },
          ]}
          openUpward
        />
      </div>
    </div>
  );
};

export default EmployeeLocationFields;
