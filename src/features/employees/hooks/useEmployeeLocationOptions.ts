import { useState, useRef, useCallback } from "react";
import {
  fetchCountries,
  fetchStatesByCountryId,
  fetchCitiesByStateId,
} from "@/shared/api/geo";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { errorMessage } from "../utils/errorMessage";

const CITY_SEARCH_DEBOUNCE_MS = 300;

export const useEmployeeLocationOptions = () => {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const citySearchTimeoutRef = useRef<number | null>(null);

  const loadCountries = useCallback(async () => {
    if (countries.length > 0) return;
    setLoadingCountries(true);
    try {
      setCountries(await fetchCountries());
    } catch (error: unknown) {
      console.error("Failed to load countries from /api/crm/master/countries:", errorMessage(error));
      setCountries([]);
    }
    setLoadingCountries(false);
  }, [countries.length]);

  const loadStates = useCallback(async (countryId: string) => {
    setStates([]);
    setCities([]);
    if (!countryId) return;
    setLoadingStates(true);
    try {
      setStates(await fetchStatesByCountryId(countryId));
    } catch (error: unknown) {
      console.error("Failed to load states from /api/crm/master/states:", errorMessage(error));
      setStates([]);
    }
    setLoadingStates(false);
  }, []);

  // Immediate, unfiltered first page — used right after a state is picked so
  // the city dropdown isn't empty before the user types anything. Never the
  // full per-state list (the backend caps a page at 200; a large state still
  // relies on `searchCities` to narrow further).
  const loadCities = useCallback(async (stateId: string) => {
    setCities([]);
    if (!stateId) return;
    setLoadingCities(true);
    try {
      setCities(await fetchCitiesByStateId(stateId));
    } catch (error: unknown) {
      console.error("Failed to load cities from /api/crm/master/cities:", errorMessage(error));
      setCities([]);
    }
    setLoadingCities(false);
  }, []);

  // Debounced, per-keystroke search — the city list is 152,970 rows, so this
  // is the only way most cities are ever reachable.
  const searchCities = useCallback((stateId: string, query: string) => {
    if (citySearchTimeoutRef.current) window.clearTimeout(citySearchTimeoutRef.current);
    if (!stateId) {
      setCities([]);
      return;
    }
    citySearchTimeoutRef.current = window.setTimeout(async () => {
      setLoadingCities(true);
      try {
        setCities(await fetchCitiesByStateId(stateId, query));
      } catch (error: unknown) {
        console.error("Failed to search cities from /api/crm/master/cities:", errorMessage(error));
        setCities([]);
      }
      setLoadingCities(false);
    }, CITY_SEARCH_DEBOUNCE_MS);
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
    searchCities,
    resetLocationOptions,
  };
};
