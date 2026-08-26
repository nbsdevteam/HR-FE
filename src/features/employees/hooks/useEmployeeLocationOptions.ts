import { useState, useCallback } from "react";
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchCitiesByState,
} from "@/shared/api/locationData";
import type { CountryOption } from "@/shared/api/locationData";

export const useEmployeeLocationOptions = () => {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const loadCountries = useCallback(async () => {
    if (countries.length > 0) return;
    setLoadingCountries(true);
    try {
      setCountries(await fetchCountries());
    } catch {
      setCountries([]);
    }
    setLoadingCountries(false);
  }, [countries.length]);

  const loadStates = useCallback(async (country: string) => {
    setStates([]);
    setCities([]);
    if (!country) return;
    setLoadingStates(true);
    try {
      setStates(await fetchStatesByCountry(country));
    } catch {
      setStates([]);
    }
    setLoadingStates(false);
  }, []);

  const loadCities = useCallback(async (country: string, state: string) => {
    setCities([]);
    if (!country || !state) return;
    setLoadingCities(true);
    try {
      setCities(await fetchCitiesByState(country, state));
    } catch {
      setCities([]);
    }
    setLoadingCities(false);
  }, []);

  const resetLocationOptions = useCallback(() => {
    setStates([]);
    setCities([]);
  }, []);

  return {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    loadCountries,
    loadStates,
    loadCities,
    resetLocationOptions,
  };
};
