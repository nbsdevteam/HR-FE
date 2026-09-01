import { useCallback } from "react";
import { ShieldAlert, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { DataTable, EmptyState, LoadingState, SearchInput, Select, TableHeaderRow } from "@/shared/components";
import type { HrAdminUserListItem } from "../api/permissionsAdmin";
import RolesPermissionsUserRow from "./RolesPermissionsUserRow";

type TRolesPermissionsDirectoryProps = {
  items: HrAdminUserListItem[];
  total: number;
  loading: boolean;
  forbidden: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  roles: string[];
  onSelectUser: (userId: number) => void;
};

const HEADINGS = [
  arabicSource("common.name"),
  arabicSource("common.email"),
  arabicSource("shared.job_title"),
  arabicSource("common.section"),
  arabicSource("settings.roles_permissions_role_column"),
  arabicSource("settings.roles_permissions_override_column"),
];

const RolesPermissionsDirectory = ({
  items,
  total,
  loading,
  forbidden,
  search,
  onSearchChange,
  role,
  onRoleChange,
  roles,
  onSelectUser,
}: TRolesPermissionsDirectoryProps) => {
  const renderUserRow = useCallback(
    (user: HrAdminUserListItem) => (
      <RolesPermissionsUserRow key={user.id} user={user} onSelect={onSelectUser} />
    ),
    [onSelectUser],
  );

  if (forbidden) {
    return (
      <EmptyState
        icon={ShieldAlert}
        message={arabicSource("errors.forbidden_title")}
        hint={arabicSource("errors.forbidden_message")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        {arabicSource("settings.roles_permissions_explainer")}
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={arabicSource("common.search")}
          inputClassName="w-full h-10 ps-9 pe-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary"
        />
        <Select
          value={role}
          onChange={onRoleChange}
          options={roles}
          optionsAreData
          blankLabel={arabicSource("settings.roles_permissions_all_roles")}
          className="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <LoadingState variant="compact" message={arabicSource("common.loading")} />
      ) : (
        <>
          <DataTable
            items={items}
            header={<TableHeaderRow headings={HEADINGS} />}
            renderRow={renderUserRow}
            emptyState={
              <EmptyState icon={Users} message={arabicSource("settings.roles_permissions_empty")} />
            }
          />
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {total} {arabicSource("settings.roles_permissions_users_count_suffix")}
          </p>
        </>
      )}
    </div>
  );
};

export default RolesPermissionsDirectory;
