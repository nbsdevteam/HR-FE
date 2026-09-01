import type { OrgReportingNode } from "@/shared/hooks";
import ReportingTreeNode from "./ReportingTreeNode";

type ReportingTreeViewProps = {
  roots: OrgReportingNode[];
};

/**
 * The reporting-line tree: every root is a real position with nobody above
 * it — never a synthetic "Organization" parent (task doc §0, §11). Each
 * root renders its own subtree, side by side.
 */
const ReportingTreeView = ({ roots }: ReportingTreeViewProps) => (
  <div className="flex flex-wrap justify-center gap-8">
    {roots.map((root) => (
      <ReportingTreeNode key={root.position_id} node={root} depth={0} />
    ))}
  </div>
);

export default ReportingTreeView;
