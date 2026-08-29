import { useCallback, useEffect, useRef, useState } from "react";
import { arabicSource } from "@/i18n/source";
import { searchPublicLeaveEmployees } from "../api/publicLeaveApi";
import { publicLeaveErrorMessage } from "../utils/publicLeaveErrorMessage";
import type { PublicLeaveEmployeeSearchResult } from "../types/publicLeave";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search-as-you-type + selection, shared by the "file a request" flow and the
 * "track my request" flow (backend hand-off §3) — each screen owns its own
 * instance so selecting an employee on one never touches the other.
 */
export const usePublicLeaveEmployeeSearch = (token: string, minSearchChars: number) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicLeaveEmployeeSearchResult[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [tooShort, setTooShort] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState<PublicLeaveEmployeeSearchResult | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (value: string) => {
    setSearching(true);
    setSearchError("");
    try {
      const data = await searchPublicLeaveEmployees(token, value);
      setResults(data.items);
      setTruncated(data.truncated);
      setTooShort(data.too_short);
    } catch (error) {
      setSearchError(publicLeaveErrorMessage(error, arabicSource("public_leave.error_generic")));
      setResults([]);
    }
    setSearching(false);
  }, [token]);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < minSearchChars) {
      setResults([]);
      setTooShort(true);
      setTruncated(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);
  }, [minSearchChars, runSearch]);

  const selectEmployee = useCallback((employee: PublicLeaveEmployeeSearchResult) => {
    setSelected(employee);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setTooShort(true);
    setTruncated(false);
    setSelected(null);
    setSearchError("");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    clearSelection,
    query,
    reset,
    results,
    searchError,
    searching,
    selectEmployee,
    selected,
    tooShort,
    truncated,
    updateQuery,
  };
};
