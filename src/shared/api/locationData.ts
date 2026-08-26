/**
 * Country / state / city / nationality reference data, sourced from public
 * APIs so the picklists stay accurate without maintaining a static dataset:
 * - mledoze/countries static dataset (via raw.githubusercontent.com) for
 *   countries + nationalities (demonyms). The former source, REST Countries'
 *   v3.1 API, was sunset and now returns a deprecation error without CORS
 *   headers, which broke this fetch in-browser; this dataset has the same
 *   `name.common` / `cca2` / `demonyms.eng.m` shape and serves CORS for any
 *   origin.
 * - Countries Now (https://countriesnow.space) for states and cities per country.
 */

const REST_COUNTRIES_URL = "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";
const COUNTRIES_NOW_BASE = "https://countriesnow.space/api/v0.1/countries";

export type CountryOption = {
  code: string;
  name: string;
  nationality: string;
};

type RestCountriesEntry = {
  cca2: string;
  name: { common: string };
  demonyms?: { eng?: { m?: string; f?: string } };
};

type CountriesNowStatesResponse = {
  data?: { states?: { name: string }[] };
};

type CountriesNowCitiesResponse = {
  data?: string[];
};

export const fetchCountries = async (): Promise<CountryOption[]> => {
  const response = await fetch(REST_COUNTRIES_URL);
  if (!response.ok) throw new Error("Failed to fetch countries");
  const entries: RestCountriesEntry[] = await response.json();
  return entries
    .map((entry) => ({
      code: entry.cca2,
      name: entry.name.common,
      nationality: entry.demonyms?.eng?.m || entry.name.common,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchStatesByCountry = async (country: string): Promise<string[]> => {
  const response = await fetch(`${COUNTRIES_NOW_BASE}/states`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
  });
  if (!response.ok) throw new Error("Failed to fetch states");
  const data: CountriesNowStatesResponse = await response.json();
  return (data.data?.states || []).map((state) => state.name);
};

export const fetchCitiesByState = async (country: string, state: string): Promise<string[]> => {
  const response = await fetch(`${COUNTRIES_NOW_BASE}/state/cities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, state }),
  });
  if (!response.ok) throw new Error("Failed to fetch cities");
  const data: CountriesNowCitiesResponse = await response.json();
  return data.data || [];
};
