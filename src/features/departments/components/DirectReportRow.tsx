import { memo } from "react";
import { NodeAvatar } from "@/shared/components";
import type { OrgNode } from "../types";

type DirectReportRowProps = {
  node: OrgNode;
};

/** One direct report listed at the bottom of the detail panel. */
const DirectReportRow = ({ node }: DirectReportRowProps) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
    <NodeAvatar
      photo={node.photo}
      name={node.name}
      color={node.color}
      initials={node.initials}
      sizeClassName="w-6 h-6"
      extraClassName="flex-shrink-0"
      fontSize={10}
    />
    <div className="min-w-0" data-i18n-ignore>
      <p className="text-foreground truncate" style={{ fontSize: 11 }}>
        {node.name}
      </p>
      <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>
        {node.position}
      </p>
    </div>
  </div>
);

export default memo(DirectReportRow);
