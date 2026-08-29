import { Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DepartmentTreeNode } from "@/shared/hooks";
import OrgStructureTreeNode from "./OrgStructureTreeNode";

type OrgStructureTreeViewProps = {
  items: DepartmentTreeNode[];
  loading: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const OrgStructureTreeView = ({ items, loading, expandedIds, onToggleExpand }: OrgStructureTreeViewProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState message={arabicSource("org_structure.no_departments_found")} />;
  }

  return (
    <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-2 shadow-lg">
      <ul>
        {items.map((node) => (
          <OrgStructureTreeNode
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </ul>
    </div>
  );
};

export default OrgStructureTreeView;
