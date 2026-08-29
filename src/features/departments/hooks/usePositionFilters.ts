import { useState, useMemo, useCallback } from "react";
import type { DbDepartment } from "@/shared/hooks";
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

/**
 * Search, fill-state chips and per-department collapse for the position list.
 * Chip counts are tallied after the search but before the chip itself, so
 * switching chips never changes the numbers on the other chips.
 */
export const usePositionFilters = ({ positionTree, departmentsById, deptColors }: Options) => {
  const [posSearch, setPosSearch] = useState("");
  const [filter, setFilter] = useState<PositionFilter>("all");
  const [collapsedDepartments, setCollapsedDepartments] = useState<Record<string, boolean>>({});

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
      ),
    [searchedRows, filter, departmentsById, deptColors],
  );

  const toggleDepartment = useCallback((departmentId: string): void => {
    setCollapsedDepartments((current) => ({
      ...current,
      [departmentId]: !current[departmentId],
    }));
  }, []);

  /** Used by the drag-hover timer — expanding an already-open group must be a no-op. */
  const expandDepartment = useCallback((departmentId: string): void => {
    setCollapsedDepartments((current) =>
      current[departmentId] ? { ...current, [departmentId]: false } : current,
    );
  }, []);

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
