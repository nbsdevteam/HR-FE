import type { ReactNode } from "react";
import { NodeAvatar } from "@/shared/components";
import type { OrgNode } from "../types";

type SelectedManagerCardProps = {
  manager: OrgNode;
  /** Sentence shown next to the avatar, e.g. "Reports to <name>". */
  label: ReactNode;
  /** Alt/aria name for the avatar (differs per modal). */
  avatarName: string;
  /** Full replacement for the card's tone classes. */
  toneClassName?: string;
};

const DEFAULT_TONE = "bg-primary/5 border-primary/10";

/**
 * Preview of the manager currently chosen in a TypeAhead — shared by the add
 * and edit employee modals, which rendered the same block twice.
 */
const SelectedManagerCard = ({
  manager,
  label,
  avatarName,
  toneClassName = DEFAULT_TONE,
}: SelectedManagerCardProps) => (
  <div
    className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg border ${toneClassName}`}
  >
    <NodeAvatar
      photo={manager.photo}
      name={avatarName}
      color={manager.color}
      initials={manager.initials}
      sizeClassName="w-7 h-7"
      extraClassName="flex-shrink-0"
      fontSize={10}
    />
    <div className="min-w-0 flex-1">
      <p className="text-foreground truncate" style={{ fontSize: 11 }}>
        {label}
      </p>
      <p className="text-muted-foreground truncate" style={{ fontSize: 10 }} data-i18n-ignore>
        {manager.department}
      </p>
    </div>
  </div>
);

export default SelectedManagerCard;
