import { useCallback, useMemo, useState } from "react";
import type { RefObject } from "react";
import {
  useOrgStructure,
  type OrgStructureDepartment,
  type OrgStructureEmployee,
  type OrgStructurePosition,
} from "@/shared/hooks";
import type { OrgNode } from "../types";
import {
  findStructureEmployee,
  findStructurePosition,
  matchStructureIds,
  searchStructureNodes,
  structureDepartmentOptions,
  structureJobTitleOptions,
} from "../utils/orgStructure";

/** Matches the tree tab's scroll-to-match delay so both views feel consistent. */
const SCROLL_TO_MATCH_DELAY_MS = 350;

/** Neutral avatar color for synthetic search rows — these aren't department nodes, so no department color applies. */
const SEARCH_RESULT_COLOR = "#8B5CF6";

export type SelectedStructureItem =
  | { kind: "position"; position: OrgStructurePosition; department?: OrgStructureDepartment }
  | {
      kind: "employee";
      employee: OrgStructureEmployee;
      position: OrgStructurePosition;
      department?: OrgStructureDepartment;
    };

type UseStructureViewArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
};

/**
 * Owns the org-structure fetch (single call for the whole page) plus the
 * search/filter/detail state for the level-wise graph.
 *
 * `HierarchyHeader`/`SearchResults`/`SearchButton` are typed against `OrgNode`
 * — rather than widen three shared components, search hits are adapted into
 * synthetic `OrgNode`-shaped objects here, the only place that happens.
 */
export const useStructureView = ({ containerRef }: UseStructureViewArgs) => {
  const { tree, loading, error } = useOrgStructure();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedStructureItem | null>(null);

  const departmentOptions = useMemo(() => structureDepartmentOptions(tree), [tree]);
  const jobTitleOptions = useMemo(() => structureJobTitleOptions(tree), [tree]);
  const hasActiveFilter = Boolean(departmentFilter || jobTitleFilter);

  const searchResults = useMemo<OrgNode[]>(() => {
    const hits = searchStructureNodes(tree, searchQuery);
    return hits.map((hit, index) => ({
      id: index,
      dbId: hit.id,
      name: hit.name,
      initials: hit.name.charAt(0),
      position: hit.subtitle,
      department: hit.department,
      color: SEARCH_RESULT_COLOR,
      photo: null,
      email: null,
      children: [],
    }));
  }, [tree, searchQuery]);

  const matchedIds = useMemo(
    () => matchStructureIds(tree, { query: searchQuery, departmentFilter, jobTitleFilter }),
    [tree, searchQuery, departmentFilter, jobTitleFilter],
  );

  const clearFilters = useCallback(() => {
    setDepartmentFilter("");
    setJobTitleFilter("");
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) setShowSearchResults(true);
  }, [searchQuery]);

  const handleCloseSearchResults = useCallback(() => setShowSearchResults(false), []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowSearchResults(false);
  }, []);

  const handleCloseDetail = useCallback(() => setSelectedItem(null), []);

  const handleSelectPosition = useCallback(
    (position: OrgStructurePosition, department?: OrgStructureDepartment) => {
      setSelectedItem({ kind: "position", position, department });
    },
    [],
  );

  const handleSelectEmployee = useCallback(
    (
      employee: OrgStructureEmployee,
      position: OrgStructurePosition,
      department?: OrgStructureDepartment,
    ) => {
      setSelectedItem({ kind: "employee", employee, position, department });
    },
    [],
  );

  const scrollToMatch = useCallback(
    (dbId: string) => {
      setTimeout(() => {
        const element = containerRef.current?.querySelector(
          `[data-structure-id="${dbId}"]`,
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, SCROLL_TO_MATCH_DELAY_MS);
    },
    [containerRef],
  );

  const handleSearchSelect = useCallback(
    (node: OrgNode) => {
      setShowSearchResults(false);
      setSearchQuery(node.name);
      scrollToMatch(node.dbId);

      if (!tree) return;
      if (node.dbId.startsWith("emp:")) {
        const found = findStructureEmployee(tree, node.dbId.slice("emp:".length));
        if (found) setSelectedItem({ kind: "employee", employee: found.employee, position: found.position, department: found.department });
        return;
      }
      const found = findStructurePosition(tree, node.dbId.slice("pos:".length));
      if (found) setSelectedItem({ kind: "position", position: found.position, department: found.department });
    },
    [tree, scrollToMatch],
  );

  return {
    structureTree: tree,
    structureLoading: loading,
    structureError: error,
    structureSearchQuery: searchQuery,
    structureShowSearchResults: showSearchResults,
    structureSearchResults: searchResults,
    structureMatchedIds: matchedIds,
    structureDepartmentOptions: departmentOptions,
    structureJobTitleOptions: jobTitleOptions,
    structureDepartmentFilter: departmentFilter,
    structureJobTitleFilter: jobTitleFilter,
    structureHasActiveFilter: hasActiveFilter,
    setStructureDepartmentFilter: setDepartmentFilter,
    setStructureJobTitleFilter: setJobTitleFilter,
    clearStructureFilters: clearFilters,
    handleStructureSearchChange: handleSearchChange,
    handleStructureSearchFocus: handleSearchFocus,
    handleStructureSearchSelect: handleSearchSelect,
    clearStructureSearch: clearSearch,
    handleCloseStructureSearchResults: handleCloseSearchResults,
    selectedStructureItem: selectedItem,
    handleSelectStructurePosition: handleSelectPosition,
    handleSelectStructureEmployee: handleSelectEmployee,
    handleCloseStructureDetail: handleCloseDetail,
  };
};
