import { useCallback } from "react";
import { ChevronDown, ChevronLeft, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DepartmentTreeNode } from "@/shared/hooks";

type OrgStructureTreeNodeProps = {
  node: DepartmentTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const OrgStructureTreeNode = ({ node, depth, expandedIds, onToggleExpand }: OrgStructureTreeNodeProps) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = depth === 0 || expandedIds.has(node.id);
  const displayCount = hasChildren && !isExpanded ? node.total_employee_count : node.employee_count;

  const handleToggle = useCallback((): void => {
    onToggleExpand(node.id);
  }, [node.id, onToggleExpand]);

  return (
    <li>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
        style={{ paddingInlineStart: depth * 20 + 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={handleToggle}
            className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground shrink-0 cursor-pointer"
            aria-label={isExpanded ? arabicSource("org_structure.collapse") : arabicSource("org_structure.expand")}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: node.color }}
          aria-hidden
        />
        <span className="text-foreground truncate" style={{ fontSize: 13 }}>
          {node.name}
        </span>
        {node.name_ar && (
          <span className="text-muted-foreground truncate" style={{ fontSize: 12 }} dir="rtl">
            {node.name_ar}
          </span>
        )}
        {!node.is_active && (
          <span className="text-amber-500 shrink-0" style={{ fontSize: 11 }}>
            {arabicSource("org_structure.archived_badge")}
          </span>
        )}
        <span className="ms-auto flex items-center gap-1 text-muted-foreground shrink-0" style={{ fontSize: 12 }}>
          <Users className="w-3.5 h-3.5" />
          {displayCount}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {node.children.map((child) => (
            <OrgStructureTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default OrgStructureTreeNode;
