import { memo, useCallback } from "react";
import { Button, NodeAvatar } from "@/shared/components";
import type { OrgNode } from "../types";

interface SearchButtonProps {
  node: OrgNode;
  onSelect: (node: OrgNode) => void;
  onClose: () => void;
}

const SearchButton = ({ node, onSelect, onClose }: SearchButtonProps) => {
  const handleClick = useCallback((): void => {
    onSelect(node);
    onClose();
  }, [node, onSelect, onClose]);

  return (
    <Button
      variant="unstyled"
      size="unstyled"
      rounded=""
      onClick={handleClick}
      className="w-full gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-start border-b border-border/20 last:border-b-0"
    >
      <NodeAvatar
        photo={node.photo}
        name={node.name}
        color={node.color}
        initials={node.initials}
        sizeClassName="w-7 h-7"
        extraClassName="flex-shrink-0"
        fontSize={11}
      />
      <div className="min-w-0 flex-1" data-i18n-ignore>
        <p className="text-foreground truncate" style={{ fontSize: 12 }}>
          {node.name}
        </p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>
          {node.position} — {node.department}
        </p>
      </div>
    </Button>
  );
};

export default memo(SearchButton);
