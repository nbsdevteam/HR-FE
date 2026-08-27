/**
 * Country / state / city reference data from the Odoo `lugal_geo` module
 * (`/api/crm/master/countries|states|cities`) — same JWT + envelope
 * convention as every other `crm/master/*` endpoint, so it goes through the
 * shared `hrCall`/`items` helpers like the rest of `shared/api`.
 *
 * Cities are never loaded in full (152,970 rows) — always query by
 * `state_id` with a search term; see `fetchCitiesByState`.
 */
import { items } from "./httpHelpers";

export interface GeoCountry {
  id: number;
  name: string;
  code: string;
}

export interface GeoState {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

export interface GeoCity {
  id: number;
  name: string;
  state_id: number | null;
  country_id: number;
}

export const fetchCountries = async (): Promise<GeoCountry[]> =>
  items<GeoCountry>("/api/crm/master/countries", { all: 1 });

export const fetchStatesByCountryId = async (countryId: number | string): Promise<GeoState[]> =>
  items<GeoState>("/api/crm/master/states", { country_id: countryId });

export const fetchCitiesByStateId = async (
  stateId: number | string,
  query = "",
): Promise<GeoCity[]> =>
  items<GeoCity>("/api/crm/master/cities", { state_id: stateId, q: query, per_page: 50 });
