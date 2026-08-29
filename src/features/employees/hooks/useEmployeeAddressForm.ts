import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { Employee } from "../types";
import { useEmployeeLocationOptions } from "./useEmployeeLocationOptions";

export const useEmployeeAddressForm = (
  isEditing: boolean,
  editData: Employee,
  setEditData: Dispatch<SetStateAction<Employee>>,
) => {
  const isArabic = useIsArabicLanguage();
  const {
    countries: locationCountries,
    states: locationStates,
    cities: locationCities,
    loadingCountries: loadingLocationCountries,
    loadingStates: loadingLocationStates,
    loadingCities: loadingLocationCities,
    citySuggestions: locationCitySuggestions,
    creatingCity: creatingLocationCity,
    cityCreateError: locationCityCreateError,
    loadCountries: loadLocationCountries,
    loadStates: loadLocationStates,
    loadCities: loadLocationCities,
    searchCities: searchLocationCities,
    requestAddCity: requestAddLocationCity,
    confirmAddCity: confirmAddLocationCity,
    dismissCitySuggestions: dismissLocationCitySuggestions,
  } = useEmployeeLocationOptions();

  const handleLocationCountryChange = useCallback((countryId: string) => {
    const country = locationCountries.find(c => String(c.id) === countryId);
    const countryName = country ? (isArabic ? country.name_ar || country.name : country.name) : "";
    setEditData(prev => ({
      ...prev,
      country: countryName,
      countryId,
      state: "",
      stateId: "",
      city: "",
      cityId: "",
    }));
    void loadLocationStates(countryId);
  }, [locationCountries, loadLocationStates, setEditData, isArabic]);

  const handleLocationStateChange = useCallback((stateId: string) => {
    const state = locationStates.find(s => String(s.id) === stateId);
    const stateName = state ? (isArabic ? state.name_ar || state.name : state.name) : "";
    setEditData(prev => ({ ...prev, state: stateName, stateId, city: "", cityId: "" }));
    void loadLocationCities(stateId);
  }, [locationStates, loadLocationCities, setEditData, isArabic]);

  const handleLocationCitySearch = useCallback((query: string) => {
    searchLocationCities(editData.stateId, query);
  }, [searchLocationCities, editData.stateId]);

  const handleAddLocationCity = useCallback(
    (name: string) => requestAddLocationCity(editData.stateId, name),
    [requestAddLocationCity, editData.stateId],
  );

  // Lazily hydrate the country/state/city picklists once editing actually
  // starts, seeded from whatever the employee already has so the dropdowns
  // aren't empty on first render.
  useEffect(() => {
    if (!isEditing) return;
    void loadLocationCountries();
    if (editData.countryId) void loadLocationStates(editData.countryId);
    if (editData.stateId) void loadLocationCities(editData.stateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  return {
    confirmAddLocationCity,
    creatingLocationCity,
    dismissLocationCitySuggestions,
    handleAddLocationCity,
    handleLocationCitySearch,
    handleLocationCountryChange,
    handleLocationStateChange,
    loadingLocationCities,
    loadingLocationCountries,
    loadingLocationStates,
    locationCities,
    locationCitySuggestions,
    locationCityCreateError,
    locationCountries,
    locationStates,
  };
};
