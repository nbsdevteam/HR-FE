import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useHierarchyData, usePositions } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { defaultDeptColorMap } from "../styles";
import {
  buildOrgTree,
  buildOrgTreeFromPositions,
  findAncestorIds,
  flattenTree,
  getUnlinkedEmployees,
} from "../utils/hierarchyTree";
import { useHierarchyCrud } from "./useHierarchyCrud";
import { useHierarchyExport } from "./useHierarchyExport";
import { useHierarchyPanZoom } from "./useHierarchyPanZoom";

export const useHierarchyPage = () => {
  const [viewMode, setViewMode] = useState<"tree" | "positions">("tree");
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalManagerId, setAddModalManagerId] = useState<number | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<OrgNode | null>(null);
  const [editTarget, setEditTarget] = useState<OrgNode | null>(null);
  const [showUnlinked, setShowUnlinked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const {
    employees: dbEmployees,
    departments: dbDepartments,
    loading: dbLoading,
    refetch,
  } = useHierarchyData();
  const {
    positions: dbPositions,
    loading: positionsLoading,
    refetch: refetchPositions,
  } = usePositions();
  const {
    containerRef,
    zoom,
    isDragging,
    panEnabled,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTogglePan,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
  } = useHierarchyPanZoom();

  const chartContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build tree from POSITIONS (single source of truth)
  const { tree: orgTree, deptColors } = useMemo(() => {
    // If positions exist, use position-based tree
    if (dbPositions.length > 0) {
      return buildOrgTreeFromPositions(dbPositions, dbEmployees, dbDepartments);
    }
    // Fallback to legacy manager_id tree for backward compatibility
    if (dbEmployees.length === 0)
      return {
        tree: {
          id: 0,
          dbId: "__root__",
          name: arabicSource("common.foundation"),
          initials: arabicSource("common.m"),
          position: arabicSource("common.senior_management"),
          department: arabicSource("common.senior_management"),
          color: "#8B5CF6",
          photo: null,
          email: null,
          children: [],
        } as OrgNode,
        deptColors: defaultDeptColorMap,
      };
    return buildOrgTree(dbEmployees, dbDepartments);
  }, [dbEmployees, dbDepartments, dbPositions]);

  const unlinkedEmps = useMemo(
    () => getUnlinkedEmployees(dbEmployees),
    [dbEmployees],
  );

  const allNodes = useMemo(() => flattenTree(orgTree), [orgTree]);
  const departments = useMemo(() => {
    const s = new Set<string>();
    allNodes.forEach((n) => s.add(n.department));
    dbDepartments.forEach((d) => s.add(d.name));
    return Array.from(s);
  }, [allNodes, dbDepartments]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return allNodes.filter(
      (n) =>
        n.name.includes(q) ||
        n.position.includes(q) ||
        n.department.includes(q),
    );
  }, [searchQuery, allNodes]);

  const { searchMatchIds, highlightedIds } = useMemo(() => {
    const matchIds = new Set<number>();
    const ancestorIds = new Set<number>();
    if (focusedNodeId) {
      matchIds.add(focusedNodeId);
      findAncestorIds(orgTree, focusedNodeId).forEach((id) =>
        ancestorIds.add(id),
      );
    } else if (searchQuery.trim() && searchResults.length > 0) {
      searchResults.forEach((n) => {
        matchIds.add(n.id);
        findAncestorIds(orgTree, n.id).forEach((id) => ancestorIds.add(id));
      });
    }
    return { searchMatchIds: matchIds, highlightedIds: ancestorIds };
  }, [searchQuery, searchResults, focusedNodeId, orgTree]);

  // Live stats from tree
  const departmentStats = useMemo(() => {
    const c: Record<string, number> = {};
    allNodes
      .filter((n) => n.dbId !== "__root__")
      .forEach((n) => {
        c[n.department] = (c[n.department] || 0) + 1;
      });
    return Object.entries(c).map(([name, count]) => ({ name, count }));
  }, [allNodes]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedMap((p) => ({ ...p, [id]: !p[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const a: Record<number, boolean> = {};
    function walk(n: OrgNode) {
      a[n.id] = true;
      n.children.forEach(walk);
    }
    walk(orgTree);
    setExpandedMap(a);
  }, [orgTree]);

  const collapseAll = useCallback(() => {
    const a: Record<number, boolean> = {};
    function walk(n: OrgNode) {
      a[n.id] = false;
      n.children.forEach(walk);
    }
    walk(orgTree);
    a[orgTree.id] = true;
    setExpandedMap(a);
  }, [orgTree]);

  const {
    handleAddEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
  } = useHierarchyCrud(
    dbEmployees,
    dbDepartments,
    dbPositions,
    orgTree,
    refetch,
    setSaving,
    setToast,
    setDeleteTarget,
    setSelectedNode,
    setEditTarget,
    setShowSetupModal,
    setShowCleanupModal,
  );

  const openAddModal = useCallback((managerId?: number) => {
    setAddModalManagerId(managerId ?? null);
    setShowAddModal(true);
  }, []);

  const openAddDepartmentModal = useCallback(() => {
    setShowAddDepartmentModal(true);
  }, []);

  const handleSearchSelect = useCallback((node: OrgNode) => {
    setFocusedNodeId(node.id);
    setSearchQuery(node.name);
    setShowSearchResults(false);
  }, []);
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setFocusedNodeId(null);
    setShowSearchResults(false);
  }, []);

  const { handlePrint, handleExportPNG } = useHierarchyExport(chartContentRef);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    setFocusedNodeId(null);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) setShowSearchResults(true);
  }, [searchQuery]);

  const handleShowUnlinked = useCallback(() => setShowUnlinked(true), []);

  const handleCloseSearchResults = useCallback(
    () => setShowSearchResults(false),
    [],
  );
  const handleSelectNode = useCallback(
    (node: OrgNode) => setSelectedNode(node),
    [],
  );
  const handleCloseSelectedNode = useCallback(() => setSelectedNode(null), []);
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddModalManagerId(null);
  }, []);
  const handleCloseDeleteModal = useCallback(() => setDeleteTarget(null), []);
  const handleCloseEditModal = useCallback(() => setEditTarget(null), []);
  const handleCloseUnlinkedPanel = useCallback(
    () => setShowUnlinked(false),
    [],
  );
  const handleCloseSetupModal = useCallback(() => setShowSetupModal(false), []);
  const handleCloseCleanupModal = useCallback(
    () => setShowCleanupModal(false),
    [],
  );
  const handleCloseAddDepartmentModal = useCallback(
    () => setShowAddDepartmentModal(false),
    [],
  );

  const handleDetailAddChild = useCallback(
    (id: number) => {
      setSelectedNode(null);
      openAddModal(id);
    },
    [openAddModal],
  );

  const handleDetailDelete = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setDeleteTarget(node);
  }, []);

  const handleDetailEdit = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setEditTarget(node);
  }, []);

  const refetchHierarchyAndPositions = useCallback(() => {
    refetch();
    refetchPositions();
  }, [refetch, refetchPositions]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (highlightedIds.size > 0 || searchMatchIds.size > 0) {
      setExpandedMap((prev) => {
        const next = { ...prev };
        highlightedIds.forEach((id) => {
          next[id] = true;
        });
        searchMatchIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
      setTimeout(() => {
        const first = searchMatchIds.values().next().value;
        if (first && containerRef.current) {
          const el = containerRef.current.querySelector(
            `[data-node-id="${first}"]`,
          );
          if (el)
            el.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
        }
      }, 350);
    }
  }, [highlightedIds, searchMatchIds]);

  // Initialize expand map when tree changes
  useEffect(() => {
    const init: Record<number, boolean> = {};
    function walk(n: OrgNode, d: number) {
      init[n.id] = d < 2;
      n.children.forEach((c) => walk(c, d + 1));
    }
    walk(orgTree, 0);
    setExpandedMap(init);
  }, [orgTree]);

  return {
    dbEmployees,
    dbDepartments,
    dbPositions,
    dbLoading,
    positionsLoading,
    orgTree,
    deptColors,
    unlinkedEmps,
    viewMode,
    setViewMode,
    expandedMap,
    selectedNode,
    zoom,
    searchQuery,
    showSearchResults,
    containerRef,
    chartContentRef,
    searchInputRef,
    showAddModal,
    addModalManagerId,
    deleteTarget,
    editTarget,
    showUnlinked,
    saving,
    showSetupModal,
    showCleanupModal,
    showAddDepartmentModal,
    toast,
    isDragging,
    panEnabled,
    allNodes,
    departments,
    searchResults,
    searchMatchIds,
    highlightedIds,
    departmentStats,
    toggleExpand,
    expandAll,
    collapseAll,
    handleAddEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
    openAddModal,
    openAddDepartmentModal,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSearchSelect,
    clearSearch,
    handlePrint,
    handleExportPNG,
    handleSearchChange,
    handleSearchFocus,
    handleShowUnlinked,
    handleCloseSearchResults,
    handleTogglePan,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
    handleSelectNode,
    handleCloseSelectedNode,
    handleCloseAddModal,
    handleCloseDeleteModal,
    handleCloseEditModal,
    handleCloseUnlinkedPanel,
    handleCloseSetupModal,
    handleCloseCleanupModal,
    handleCloseAddDepartmentModal,
    handleDetailAddChild,
    handleDetailDelete,
    handleDetailEdit,
    refetchHierarchyAndPositions,
  };
};
