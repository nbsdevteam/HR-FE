import { useState, useMemo, useCallback, useEffect } from "react";
import type { RefObject } from "react";
import type { OrgNode } from "../types";
import { findAncestorIds } from "../utils/hierarchyTree";

export type HierarchyViewMode = "tree" | "positions";

/** Matches the tree's expand animation before scrolling the first hit into view. */
const SCROLL_TO_MATCH_DELAY_MS = 350;
/** Depth at which nodes start out collapsed when a fresh tree arrives. */
const INITIAL_EXPANDED_DEPTH = 2;

type UseHierarchyViewArgs = {
  orgTree: OrgNode;
  allNodes: OrgNode[];
  containerRef: RefObject<HTMLDivElement | null>;
};

/**
 * View-side state of the hierarchy page: which view is showing, which branches
 * are expanded, and the search query with everything derived from it.
 */
export const useHierarchyView = ({
  orgTree,
  allNodes,
  containerRef,
}: UseHierarchyViewArgs) => {
  const [viewMode, setViewMode] = useState<HierarchyViewMode>("tree");
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allNodes.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.position.toLowerCase().includes(query) ||
        node.department.toLowerCase().includes(query),
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
      searchResults.forEach((node) => {
        matchIds.add(node.id);
        findAncestorIds(orgTree, node.id).forEach((id) => ancestorIds.add(id));
      });
    }
    return { searchMatchIds: matchIds, highlightedIds: ancestorIds };
  }, [searchQuery, searchResults, focusedNodeId, orgTree]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedMap((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const next: Record<number, boolean> = {};
    const walk = (node: OrgNode): void => {
      next[node.id] = true;
      node.children.forEach(walk);
    };
    walk(orgTree);
    setExpandedMap(next);
  }, [orgTree]);

  const collapseAll = useCallback(() => {
    const next: Record<number, boolean> = {};
    const walk = (node: OrgNode): void => {
      next[node.id] = false;
      node.children.forEach(walk);
    };
    walk(orgTree);
    next[orgTree.id] = true;
    setExpandedMap(next);
  }, [orgTree]);

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    setFocusedNodeId(null);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) setShowSearchResults(true);
  }, [searchQuery]);

  const handleCloseSearchResults = useCallback(
    () => setShowSearchResults(false),
    [],
  );

  // Reveal (and scroll to) whatever the current search matched.
  useEffect(() => {
    if (highlightedIds.size === 0 && searchMatchIds.size === 0) return;
    setExpandedMap((previous) => {
      const next = { ...previous };
      highlightedIds.forEach((id) => {
        next[id] = true;
      });
      searchMatchIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
    const timer = setTimeout(() => {
      const first = searchMatchIds.values().next().value;
      if (!first || !containerRef.current) return;
      const element = containerRef.current.querySelector(
        `[data-node-id="${first}"]`,
      );
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }, SCROLL_TO_MATCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [highlightedIds, searchMatchIds, containerRef]);

  // Initialize expand map when tree changes
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    const walk = (node: OrgNode, depth: number): void => {
      initial[node.id] = depth < INITIAL_EXPANDED_DEPTH;
      node.children.forEach((child) => walk(child, depth + 1));
    };
    walk(orgTree, 0);
    setExpandedMap(initial);
  }, [orgTree]);

  return {
    viewMode,
    setViewMode,
    expandedMap,
    searchQuery,
    showSearchResults,
    searchResults,
    searchMatchIds,
    highlightedIds,
    toggleExpand,
    expandAll,
    collapseAll,
    handleSearchSelect,
    clearSearch,
    handleSearchChange,
    handleSearchFocus,
    handleCloseSearchResults,
  };
};
