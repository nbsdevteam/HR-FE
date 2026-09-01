import { useState } from "react";

export type HierarchyViewMode = "tree" | "positions";

/** Which top-level view the Hierarchy page is showing. */
export const useHierarchyView = () => {
  const [viewMode, setViewMode] = useState<HierarchyViewMode>("tree");

  return {
    viewMode,
    setViewMode,
  };
};
