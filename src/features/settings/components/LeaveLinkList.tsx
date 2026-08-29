import { arabicSource } from "@/i18n/source";
import type { DbLeaveLink } from "@/shared/hooks";
import LeaveLinkListItem from "./LeaveLinkListItem";

type LeaveLinkListProps = {
  links: DbLeaveLink[];
  onDelete: (link: DbLeaveLink) => void;
  onEdit: (link: DbLeaveLink) => void;
  onRotate: (link: DbLeaveLink) => void;
};

const LeaveLinkList = ({ links, onDelete, onEdit, onRotate }: LeaveLinkListProps) => {
  if (links.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-6">
        {arabicSource("settings.leave_links_empty")}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {links.map((link) => (
        <LeaveLinkListItem key={link.id} link={link} onDelete={onDelete} onEdit={onEdit} onRotate={onRotate} />
      ))}
    </div>
  );
};

export default LeaveLinkList;
