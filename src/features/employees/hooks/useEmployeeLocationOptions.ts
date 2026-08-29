import { useState, useRef, useCallback } from "react";
import {
  fetchCountries,
  fetchStatesByCountryId,
  fetchCitiesByStateId,
  createCity,
} from "@/shared/api/geo";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { errorMessage } from "../utils/errorMessage";

const CITY_SEARCH_DEBOUNCE_MS = 300;

type PendingCityRequest = { stateId: string; name: string };

export const useEmployeeLocationOptions = () => {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<GeoCity[]>([]);
  const [pendingCityRequest, setPendingCityRequest] = useState<PendingCityRequest | null>(null);
  const [creatingCity, setCreatingCity] = useState(false);
  const [cityCreateError, setCityCreateError] = useState<string | null>(null);
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

  // Debounced, per-keystroke search — narrows a per-state city list that can
  // be arbitrarily large.
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

  // Makes a freshly created/suggested city immediately selectable without a
  // refetch — the backend has no review queue, so it's visible right away.
  const upsertCity = useCallback((city: GeoCity) => {
    setCities(prev => (prev.some(c => c.id === city.id) ? prev : [city, ...prev]));
  }, []);

  // §2 of the hand-off: (a) an identical city already exists → `city` is set,
  // select it silently; (b) near-matches exist → `suggestions` is set, no
  // `city` yet, caller should show a "did you mean?" prompt; (c) created →
  // `city` is set. Checking `city` first covers both (a) and (c) uniformly.
  const requestAddCity = useCallback(async (stateId: string, name: string, confirm = false): Promise<GeoCity | null> => {
    const trimmedName = name.trim();
    if (!stateId || !trimmedName) return null;
    setCreatingCity(true);
    setCityCreateError(null);
    try {
      const result = await createCity({ name: trimmedName, state_id: stateId, confirm });
      if (result.city) {
        upsertCity(result.city);
        setCitySuggestions([]);
        setPendingCityRequest(null);
        return result.city;
      }
      if (result.suggestions?.length) {
        result.suggestions.forEach(upsertCity);
        setCitySuggestions(result.suggestions);
        setPendingCityRequest({ stateId, name: trimmedName });
      }
      return null;
    } catch (error: unknown) {
      setCityCreateError(errorMessage(error));
      return null;
    } finally {
      setCreatingCity(false);
    }
  }, [upsertCity]);

  // "None of the suggestions, create mine anyway" — resends the same request
  // with `confirm: true`, which skips the similarity check.
  const confirmAddCity = useCallback(async (): Promise<GeoCity | null> => {
    if (!pendingCityRequest) return null;
    return requestAddCity(pendingCityRequest.stateId, pendingCityRequest.name, true);
  }, [pendingCityRequest, requestAddCity]);

  const dismissCitySuggestions = useCallback(() => {
    setCitySuggestions([]);
    setPendingCityRequest(null);
    setCityCreateError(null);
  }, []);

  const resetLocationOptions = useCallback(() => {
    setStates([]);
    setCities([]);
    dismissCitySuggestions();
  }, [dismissCitySuggestions]);

  return {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    citySuggestions,
    creatingCity,
    cityCreateError,
    loadCountries,
    loadStates,
    loadCities,
    searchCities,
    requestAddCity,
    confirmAddCity,
    dismissCitySuggestions,
    resetLocationOptions,
  };
};
