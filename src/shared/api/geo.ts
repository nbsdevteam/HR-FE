/**
 * Country / state / city reference data from Odoo's `geo_master_controller`
 * (`addons/lugal_crm/controllers/geo_master_controller.py`, exposed at
 * `/api/crm/master/countries|states|cities`) — same JWT + envelope
 * convention as every other `crm/master/*` endpoint, so it goes through the
 * shared `hrCall`/`items` helpers like the rest of `shared/api`.
 *
 * Cities always come back empty: `res.city` isn't installed in this Odoo
 * deployment, and there's no city dataset for this install's country even
 * where that model exists. `cities_list` still accepts `state_id`/`q` and
 * always queries by state, so the shape here (and the UI built on it) is
 * ready the moment a real city dataset lands.
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
