import { useCallback, useMemo } from "react";
import { MapPin, Building2 } from "lucide-react";
import { Select, TypeAhead } from "@/shared/components";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";
import EmployeeFieldRow from "./EmployeeFieldRow";

const getCountryId = (country: GeoCountry): string => String(country.id);
const getCountryLabel = (country: GeoCountry): string => country.name;
const getStateId = (state: GeoState): string => String(state.id);
const getStateLabel = (state: GeoState): string => state.name;
const getCityId = (city: GeoCity): string => String(city.id);
const getCityLabel = (city: GeoCity): string => city.name;
const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";
const fieldLabelClass = "text-muted-foreground block mb-1";

const workLocationLabel = (value: string): string => {
  if (value === "local") return arabicSource("employees.work_location_local");
  if (value === "remote") return arabicSource("employees.work_location_remote");
  return "—";
};

type EmployeeAddressFieldsProps = {
  editData: Employee;
  isEditing: boolean;
  countries: GeoCountry[];
  states: GeoState[];
  cities: GeoCity[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  onFieldChange: (field: keyof Employee, value: string) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCitySearch: (query: string) => void;
};

const EmployeeAddressFields = ({
  editData,
  isEditing,
  countries,
  states,
  cities,
  loadingCountries,
  loadingStates,
  loadingCities,
  onFieldChange,
  onCountryChange,
  onStateChange,
  onCitySearch,
}: EmployeeAddressFieldsProps) => {
  // The fetched pages (countries: full set; states: full set per country;
  // cities: a search-driven page) may not include the employee's already-saved
  // selection yet — fall back to the name already on the record so the picker
  // shows the right label before/without that item being in the loaded page.
  const fallbackLabels = useMemo(() => ({
    ...(editData.countryId ? { [editData.countryId]: editData.country } : {}),
    ...(editData.stateId ? { [editData.stateId]: editData.state } : {}),
    ...(editData.cityId ? { [editData.cityId]: editData.city } : {}),
  }), [editData.countryId, editData.country, editData.stateId, editData.state, editData.cityId, editData.city]);

  const handleCityChange = useCallback(
    (value: string): void => {
      const city = cities.find(c => String(c.id) === value);
      onFieldChange("cityId", value);
      onFieldChange("city", city?.name || "");
    },
    [onFieldChange, cities],
  );

  const handleResidenceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => onFieldChange("residence", e.target.value),
    [onFieldChange],
  );

  const handleWorkLocationChange = useCallback(
    (value: string): void => onFieldChange("workLocation", value),
    [onFieldChange],
  );

  return (
    <>
      <EmployeeFieldRow
        icon={MapPin} iconColor="text-primary" label={arabicSource("common.address")} value={editData.address || "—"}
        isEditing={isEditing}
        editElement={
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("employees.country")}</label>
              <TypeAhead
                items={countries}
                getId={getCountryId}
                getLabel={getCountryLabel}
                value={editData.countryId}
                onChange={onCountryChange}
                fallbackLabels={fallbackLabels}
                placeholder={arabicSource(loadingCountries ? "common.loading" : "employees.select_the_country")}
                openUpward
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("employees.state")}</label>
              <TypeAhead
                items={states}
                getId={getStateId}
                getLabel={getStateLabel}
                value={editData.stateId}
                onChange={onStateChange}
                fallbackLabels={fallbackLabels}
                placeholder={arabicSource(loadingStates ? "common.loading" : "employees.select_the_state")}
                disabled={!editData.countryId}
                openUpward
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("common.city")}</label>
              <TypeAhead
                items={cities}
                getId={getCityId}
                getLabel={getCityLabel}
                value={editData.cityId}
                onChange={handleCityChange}
                onQueryChange={onCitySearch}
                remoteFilter
                fallbackLabels={fallbackLabels}
                placeholder={arabicSource(loadingCities ? "common.loading" : "employees.select_the_city")}
                disabled={!editData.stateId}
                openUpward
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("employees.residence")}</label>
              <input value={editData.residence} onChange={handleResidenceChange}
                className={inputClass} style={{ fontSize: 13 }} />
            </div>
          </div>
        }
      />
      <EmployeeFieldRow
        icon={Building2} iconColor="text-primary" label={arabicSource("employees.work_location")} value={workLocationLabel(editData.workLocation)}
        isEditing={isEditing}
        editElement={
          <Select
            value={editData.workLocation}
            onChange={handleWorkLocationChange}
            placeholder={arabicSource("employees.select_the_work_location")}
            blankLabel={arabicSource("common.not_specified")}
            options={[
              { value: "local", label: arabicSource("employees.work_location_local") },
              { value: "remote", label: arabicSource("employees.work_location_remote") },
            ]}
            className={inputClass}
            style={{ fontSize: 14 }}
            openUpward
          />
        }
      />
    </>
  );
};

export default EmployeeAddressFields;
