import { useCallback } from "react";
import { TypeAhead, Select } from "@/shared/components";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm, WorkLocation } from "../types";
import CityTypeAheadField from "./CityTypeAheadField";
import LabeledInput from "./LabeledInput";

const getCountryId = (country: GeoCountry): string => String(country.id);
// The Odoo geo API has no demonym data, so nationality is picked from the
// same country list and identified/stored by the plain country name.
const getNationalityId = (country: GeoCountry): string => country.name;
const getStateId = (state: GeoState): string => String(state.id);
const geoSearchText = (item: { name: string; name_ar: string }): string => `${item.name} ${item.name_ar}`;
const fieldLabelClass = "text-foreground block mb-1.5";

type EmployeeLocationFieldsProps = {
  addForm: EmployeeAddForm;
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

const EmployeeLocationFields = ({
  addForm,
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
}: EmployeeLocationFieldsProps) => {
  const isArabic = useIsArabicLanguage();

  const getCountryLabel = useCallback(
    (country: GeoCountry): string => (isArabic ? country.name_ar || country.name : country.name),
    [isArabic],
  );

  const getNationalityLabel = useCallback(
    (country: GeoCountry): string => (isArabic ? country.name_ar || country.name : country.name),
    [isArabic],
  );

  const getStateLabel = useCallback(
    (state: GeoState): string => (isArabic ? state.name_ar || state.name : state.name),
    [isArabic],
  );

  const handleCitySelected = useCallback(
    (city: GeoCity): void => {
      onFormChange({ city: isArabic ? city.name_ar || city.name : city.name, cityId: String(city.id) });
    },
    [onFormChange, isArabic],
  );

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
          getSearchText={geoSearchText}
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
          getSearchText={geoSearchText}
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
          getSearchText={geoSearchText}
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
        <CityTypeAheadField
          cities={cities}
          value={addForm.cityId}
          onChange={onCityChange}
          onSearch={onCitySearch}
          placeholder={arabicSource(
            loadingCities ? "common.loading" : "employees.select_the_city",
          )}
          disabled={!addForm.stateId}
          citySuggestions={citySuggestions}
          creatingCity={creatingCity}
          cityCreateError={cityCreateError}
          onAddCity={onAddCity}
          onConfirmAddCity={onConfirmAddCity}
          onDismissSuggestions={onDismissCitySuggestions}
          onCitySelected={handleCitySelected}
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
