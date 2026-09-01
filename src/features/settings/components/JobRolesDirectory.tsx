import { useCallback } from "react";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, DataTable, EmptyState, LoadingState, SearchInput, TableHeaderRow } from "@/shared/components";
import type { HrRoleListItem } from "../api/permissionsAdmin";
import JobRoleRow from "./JobRoleRow";

type TJobRolesDirectoryProps = {
  items: HrRoleListItem[];
  loading: boolean;
  forbidden: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  canManage: boolean;
  onSelectRole: (jobTitle: string) => void;
  onNewRole: () => void;
};

const HEADINGS = [
  arabicSource("settings.roles_permissions_role_label_column"),
  arabicSource("settings.roles_permissions_role_job_title_column"),
  arabicSource("settings.roles_permissions_role_users_column"),
  "",
];

const JobRolesDirectory = ({
  items,
  loading,
  forbidden,
  search,
  onSearchChange,
  canManage,
  onSelectRole,
  onNewRole,
}: TJobRolesDirectoryProps) => {
  const renderRoleRow = useCallback(
    (role: HrRoleListItem) => <JobRoleRow key={role.job_title} role={role} onSelect={onSelectRole} />,
    [onSelectRole],
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
        {arabicSource("settings.roles_permissions_roles_explainer")}
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={arabicSource("common.search")}
          inputClassName="w-full h-10 ps-9 pe-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary"
        />
        {canManage && (
          <Button variant="primary" size="sm" icon={Plus} onClick={onNewRole}>
            {arabicSource("settings.roles_permissions_new_role")}
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState variant="compact" message={arabicSource("common.loading")} />
      ) : (
        <DataTable
          items={items}
          header={<TableHeaderRow headings={HEADINGS} />}
          renderRow={renderRoleRow}
          emptyState={
            <EmptyState icon={ShieldCheck} message={arabicSource("settings.roles_permissions_roles_empty")} />
          }
        />
      )}
    </div>
  );
};

export default JobRolesDirectory;
