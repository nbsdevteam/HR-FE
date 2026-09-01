import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { OrgReportingNode } from "@/shared/hooks";
import ReportingTreeNode from "./ReportingTreeNode";
import TreeConnectors from "./TreeConnectors";

type ReportingTreeChildrenProps = {
  parentRef: RefObject<HTMLDivElement | null>;
  nodes: OrgReportingNode[];
  depth: number;
};

/**
 * Fans a node's direct reports out from its card, wired the same way
 * department cards fan out from the root (`StructureCardsRoot`).
 */
const ReportingTreeChildren = ({ parentRef, nodes, depth }: ReportingTreeChildrenProps) => {
  const childRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    childRefs.current = childRefs.current.slice(0, nodes.length);
  }, [nodes.length]);

  const registerChildRef = (index: number, el: HTMLDivElement | null): void => {
    childRefs.current[index] = el;
  };

  return (
    <div className="relative flex flex-col items-center">
      <TreeConnectors parentRef={parentRef} childRefs={childRefs} color="var(--color-border)" />
      <div className="relative z-[1] flex flex-wrap justify-center gap-6 pt-8">
        {nodes.map((node, index) => (
          <div key={node.position_id} ref={(el) => registerChildRef(index, el)}>
            <ReportingTreeNode node={node} depth={depth} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportingTreeChildren;
