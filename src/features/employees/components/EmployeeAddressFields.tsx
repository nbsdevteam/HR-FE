import { useCallback } from "react";
import { MapPin, Building2 } from "lucide-react";
import { Select, TypeAhead } from "@/shared/components";
import type { CountryOption } from "@/shared/api/locationData";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";
import EmployeeFieldRow from "./EmployeeFieldRow";

const stringIdentity = (value: string): string => value;
const getCountryId = (country: CountryOption): string => country.name;
const getCountryLabel = (country: CountryOption): string => country.name;
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
  countries: CountryOption[];
  states: string[];
  cities: string[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  onFieldChange: (field: keyof Employee, value: string) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
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
}: EmployeeAddressFieldsProps) => {
  const handleCityChange = useCallback(
    (value: string): void => onFieldChange("city", value),
    [onFieldChange],
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
                value={editData.country}
                onChange={onCountryChange}
                placeholder={arabicSource(loadingCountries ? "common.loading" : "employees.select_the_country")}
                openUpward
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("employees.state")}</label>
              <TypeAhead
                items={states}
                getId={stringIdentity}
                getLabel={stringIdentity}
                value={editData.state}
                onChange={onStateChange}
                placeholder={arabicSource(loadingStates ? "common.loading" : "employees.select_the_state")}
                disabled={!editData.country}
                openUpward
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 11 }}>{arabicSource("common.city")}</label>
              <TypeAhead
                items={cities}
                getId={stringIdentity}
                getLabel={stringIdentity}
                value={editData.city}
                onChange={handleCityChange}
                placeholder={arabicSource(loadingCities ? "common.loading" : "employees.select_the_city")}
                disabled={!editData.state}
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
