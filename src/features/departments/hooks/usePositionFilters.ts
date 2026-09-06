import { useState, useMemo, useCallback } from "react";
import type { DbDepartment } from "@/shared/hooks";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { PositionFilter, PositionNode } from "../types";
import {
  countPositionRows,
  filterPositionRowsByQuery,
  flattenPositionRows,
  groupPositionRows,
  matchesPositionFilter,
} from "../utils/positionGroups";

type Options = {
  positionTree: PositionNode[];
  departmentsById: Map<string, DbDepartment>;
  deptColors: Record<string, string>;
};

const COLLAPSED_DEPARTMENTS_STORAGE_KEY = "hr-positions-collapsed-departments";

const readStoredCollapsedDepartments = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(COLLAPSED_DEPARTMENTS_STORAGE_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
};

/**
 * Search, fill-state chips and per-department collapse for the position list.
 * Chip counts are tallied after the search but before the chip itself, so
 * switching chips never changes the numbers on the other chips. Collapse
 * state is persisted to localStorage so a card left collapsed stays that way
 * across visits.
 */
export const usePositionFilters = ({ positionTree, departmentsById, deptColors }: Options) => {
  const [posSearch, setPosSearch] = useState("");
  const [filter, setFilter] = useState<PositionFilter>("all");
  const [collapsedDepartments, setCollapsedDepartments] = useState<Record<string, boolean>>(
    readStoredCollapsedDepartments,
  );
  const isArabic = useIsArabicLanguage();

  const allRows = useMemo(() => flattenPositionRows(positionTree), [positionTree]);

  const searchedRows = useMemo(
    () => filterPositionRowsByQuery(allRows, posSearch, departmentsById),
    [allRows, posSearch, departmentsById],
  );

  const filterCounts = useMemo(() => countPositionRows(searchedRows), [searchedRows]);

  const groups = useMemo(
    () =>
      groupPositionRows(
        searchedRows.filter((row) => matchesPositionFilter(row, filter)),
        departmentsById,
        deptColors,
        isArabic,
      ),
    [searchedRows, filter, departmentsById, deptColors, isArabic],
  );

  const persistCollapsedDepartments = useCallback((next: Record<string, boolean>): void => {
    try {
      localStorage.setItem(COLLAPSED_DEPARTMENTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — collapse
      // state simply won't persist across visits.
    }
  }, []);

  const toggleDepartment = useCallback(
    (departmentId: string): void => {
      setCollapsedDepartments((current) => {
        const next = { ...current, [departmentId]: !current[departmentId] };
        persistCollapsedDepartments(next);
        return next;
      });
    },
    [persistCollapsedDepartments],
  );

  /** Used by the drag-hover timer — expanding an already-open group must be a no-op. */
  const expandDepartment = useCallback(
    (departmentId: string): void => {
      setCollapsedDepartments((current) => {
        if (!current[departmentId]) return current;
        const next = { ...current, [departmentId]: false };
        persistCollapsedDepartments(next);
        return next;
      });
    },
    [persistCollapsedDepartments],
  );

  const clearPosSearch = useCallback((): void => setPosSearch(""), []);

  return {
    posSearch,
    setPosSearch,
    clearPosSearch,
    filter,
    setFilter,
    filterCounts,
    groups,
    hasPositions: allRows.length > 0,
    collapsedDepartments,
    toggleDepartment,
    expandDepartment,
  };
};
