import { useCallback } from "react";
import { StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { HrAdminUserListItem } from "../api/permissionsAdmin";

type TRolesPermissionsUserRowProps = {
  user: HrAdminUserListItem;
  onSelect: (userId: number) => void;
};

const RolesPermissionsUserRow = ({ user, onSelect }: TRolesPermissionsUserRowProps) => {
  const handleClick = useCallback((): void => {
    onSelect(user.id);
  }, [onSelect, user.id]);

  return (
    <tr
      onClick={handleClick}
      className="border-t border-border/20 hover:bg-secondary/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {user.name}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {user.email}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {user.job_title}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {user.department}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {user.role_label}
      </td>
      <td className="px-4 py-2.5">
        {user.has_hr_override && (
          <StatusBadge colorClassName="border-primary/30 bg-primary/10 text-primary">
            {arabicSource("settings.roles_permissions_custom_badge")}
          </StatusBadge>
        )}
      </td>
    </tr>
  );
};

export default RolesPermissionsUserRow;
