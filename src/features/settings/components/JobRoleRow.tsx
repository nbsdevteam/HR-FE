import { useCallback } from "react";
import { StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { HrRoleListItem } from "../api/permissionsAdmin";

type TJobRoleRowProps = {
  role: HrRoleListItem;
  onSelect: (jobTitle: string) => void;
};

const JobRoleRow = ({ role, onSelect }: TJobRoleRowProps) => {
  const handleClick = useCallback((): void => {
    onSelect(role.job_title);
  }, [onSelect, role.job_title]);

  return (
    <tr
      onClick={handleClick}
      className="border-t border-border/20 hover:bg-secondary/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {role.label}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {role.job_title}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 13 }}>
        {role.user_count}
      </td>
      <td className="px-4 py-2.5">
        {!role.is_hr_only && (
          <StatusBadge colorClassName="border-amber-500/30 text-amber-500 bg-amber-500/10">
            {arabicSource("settings.roles_permissions_role_shared_badge")}
          </StatusBadge>
        )}
      </td>
    </tr>
  );
};

export default JobRoleRow;
