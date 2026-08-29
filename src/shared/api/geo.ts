/**
 * Country / state / city reference data from Odoo's `geo_master_controller`
 * (`addons/lugal_geo`, exposed at `/api/crm/master/countries|states|cities`)
 * — same JWT + envelope convention as every other `crm/master/*` endpoint,
 * so it goes through the shared `hrCall`/`items` helpers like the rest of
 * `shared/api`.
 *
 * Every row carries both `name` (English/Latin) and `name_ar` (Arabic,
 * falling back to `name` where no Arabic value exists — never blank).
 * There is no `lang` parameter: both languages arrive in one response, so
 * switching the UI language is a re-render, not a refetch.
 */
import { hrCall } from "./client";
import { items } from "./httpHelpers";

export interface GeoCountry {
  id: number;
  name: string;
  name_ar: string;
  code: string;
}

export interface GeoState {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  country_id: number;
}

export type GeoCitySource = "dr5hn" | "user";

export interface GeoCity {
  id: number;
  name: string;
  name_ar: string;
  state_id: number | null;
  country_id: number;
  source: GeoCitySource;
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

export type CreateCityParams = {
  name: string;
  state_id: number | string;
  name_ar?: string;
  zipcode?: string;
  confirm?: boolean;
};

/**
 * Three possible outcomes, discriminated as documented by the backend:
 * - `created: true` → a brand-new row, always accompanied by `city`.
 * - `created: false` with `city` set → an identical city already existed
 *   (`duplicate_of` mirrors it); safe to just use `city`.
 * - `created: false` with no `city` → `suggestions` holds near-matches for
 *   a "did you mean…?" prompt. Resend with `confirm: true` to force creation.
 */
export type CreateCityResult = {
  created: boolean;
  city?: GeoCity;
  duplicate_of?: GeoCity;
  suggestions?: GeoCity[];
};

export const createCity = async (params: CreateCityParams): Promise<CreateCityResult> =>
  hrCall<CreateCityResult>("/api/crm/master/cities/create", {
    name: params.name,
    state_id: Number(params.state_id),
    ...(params.name_ar ? { name_ar: params.name_ar } : {}),
    ...(params.zipcode ? { zipcode: params.zipcode } : {}),
    ...(params.confirm ? { confirm: true } : {}),
  });
