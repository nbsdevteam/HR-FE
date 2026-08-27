import { useCallback } from "react";
import { TypeAhead, Select } from "@/shared/components";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm, WorkLocation } from "../types";
import LabeledInput from "./LabeledInput";

const getCountryId = (country: GeoCountry): string => String(country.id);
const getCountryLabel = (country: GeoCountry): string => country.name;
// The Odoo geo API has no demonym data, so nationality is picked from the
// same country list and identified/stored by the plain country name.
const getNationalityId = (country: GeoCountry): string => country.name;
const getNationalityLabel = (country: GeoCountry): string => country.name;
const getStateId = (state: GeoState): string => String(state.id);
const getStateLabel = (state: GeoState): string => state.name;
const getCityId = (city: GeoCity): string => String(city.id);
const getCityLabel = (city: GeoCity): string => city.name;
const fieldLabelClass = "text-foreground block mb-1.5";

type EmployeeLocationFieldsProps = {
  addForm: EmployeeAddForm;
  countries: GeoCountry[];
  states: GeoState[];
  cities: GeoCity[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCitySearch: (query: string) => void;
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
  onCityChange,
  onCitySearch,
}: EmployeeLocationFieldsProps) => {
  const handleNationalityChange = useCallback(
    (value: string): void => onFormChange({ nationality: value }),
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
          value={addForm.countryId}
          onChange={onCountryChange}
          placeholder={arabicSource(
            loadingCountries ? "common.loading" : "employees.select_the_country",
          )}
        />
      </div>
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("employees.state")}
        </label>
        <TypeAhead
          items={states}
          getId={getStateId}
          getLabel={getStateLabel}
          value={addForm.stateId}
          onChange={onStateChange}
          placeholder={arabicSource(
            loadingStates ? "common.loading" : "employees.select_the_state",
          )}
          disabled={!addForm.countryId}
        />
      </div>
      <div>
        <label className={fieldLabelClass} style={{ fontSize: 12 }}>
          {arabicSource("common.city")}
        </label>
        <TypeAhead
          items={cities}
          getId={getCityId}
          getLabel={getCityLabel}
          value={addForm.cityId}
          onChange={onCityChange}
          onQueryChange={onCitySearch}
          remoteFilter
          placeholder={arabicSource(
            loadingCities ? "common.loading" : "employees.select_the_city",
          )}
          disabled={!addForm.stateId}
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
          blankLabel={arabicSource("common.not_specified")}
          options={[
            { value: "local", label: arabicSource("employees.work_location_local") },
            { value: "remote", label: arabicSource("employees.work_location_remote") },
          ]}
        />
      </div>
    </div>
  );
};

export default EmployeeLocationFields;
