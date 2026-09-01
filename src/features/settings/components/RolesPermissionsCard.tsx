import { useCallback, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { HrRoleListItem } from "../api/permissionsAdmin";
import { useHrPermissionsAdmin } from "../hooks/useHrPermissionsAdmin";
import { useHrRolesAdmin } from "../hooks/useHrRolesAdmin";
import { useRolesPermissionsAccess } from "../hooks/useRolesPermissionsAccess";
import type { RolesPermissionsTabId } from "../types";
import JobRoleEditorPanel from "./JobRoleEditorPanel";
import JobRolesDirectory from "./JobRolesDirectory";
import PermissionEditorPanel from "./PermissionEditorPanel";
import RolesPermissionsDirectory from "./RolesPermissionsDirectory";
import RolesPermissionsTabs from "./RolesPermissionsTabs";
import SettingsSectionCard from "./SettingsSectionCard";

type TRolesPermissionsCardProps = {
  showToast: (message: string) => void;
};

const WIDE_MODAL_CLASS =
  "bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col overflow-hidden";

const RolesPermissionsCard = ({ showToast }: TRolesPermissionsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RolesPermissionsTabId>("users");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<HrRoleListItem | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const { canView, canManage } = useRolesPermissionsAccess();
  const { schema, items, total, search, setSearch, role, setRole, loading, forbidden, refetch } =
    useHrPermissionsAdmin(isOpen);
  const {
    items: roleItems,
    search: roleSearch,
    setSearch: setRoleSearch,
    loading: rolesLoading,
    forbidden: rolesForbidden,
    refetch: refetchRoles,
  } = useHrRolesAdmin(isOpen && activeTab === "job_roles");

  const handleDialogOpen = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const handleDialogClose = useCallback((): void => {
    setIsOpen(false);
    setActiveTab("users");
    setSelectedUserId(null);
    setSelectedRole(null);
    setIsCreatingRole(false);
  }, []);

  const handleSelectUser = useCallback((userId: number): void => {
    setSelectedUserId(userId);
  }, []);

  const handleBackToDirectory = useCallback((): void => {
    setSelectedUserId(null);
  }, []);

  const handleSelectRole = useCallback(
    (jobTitle: string): void => {
      const found = roleItems.find((item) => item.job_title === jobTitle) ?? null;
      setSelectedRole(found);
      setIsCreatingRole(false);
    },
    [roleItems],
  );

  const handleNewRole = useCallback((): void => {
    setSelectedRole(null);
    setIsCreatingRole(true);
  }, []);

  const handleBackToRolesDirectory = useCallback((): void => {
    setSelectedRole(null);
    setIsCreatingRole(false);
  }, []);

  const handleRoleSaved = useCallback((): void => {
    setSelectedRole(null);
    setIsCreatingRole(false);
    refetchRoles();
  }, [refetchRoles]);

  if (!canView) return null;

  const showingRoleEditor = isCreatingRole || selectedRole !== null;

  return (
    <SettingsSectionCard
      icon={ShieldCheck}
      title={arabicSource("settings.roles_permissions_title")}
      description={arabicSource("settings.roles_permissions_description")}
      delay={0.5}
      modalContentClassName={WIDE_MODAL_CLASS}
      onOpen={handleDialogOpen}
      onClose={handleDialogClose}
    >
      <div className="space-y-4">
        <RolesPermissionsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "users" ? (
          selectedUserId !== null ? (
            <PermissionEditorPanel
              userId={selectedUserId}
              schema={schema}
              showToast={showToast}
              onBack={handleBackToDirectory}
              onSaved={refetch}
            />
          ) : (
            <RolesPermissionsDirectory
              items={items}
              total={total}
              loading={loading}
              forbidden={forbidden}
              search={search}
              onSearchChange={setSearch}
              role={role}
              onRoleChange={setRole}
              roles={schema?.roles ?? []}
              onSelectUser={handleSelectUser}
            />
          )
        ) : showingRoleEditor ? (
          <JobRoleEditorPanel
            role={selectedRole}
            schema={schema}
            canManage={canManage}
            showToast={showToast}
            onBack={handleBackToRolesDirectory}
            onSaved={handleRoleSaved}
          />
        ) : (
          <JobRolesDirectory
            items={roleItems}
            loading={rolesLoading}
            forbidden={rolesForbidden}
            search={roleSearch}
            onSearchChange={setRoleSearch}
            canManage={canManage}
            onSelectRole={handleSelectRole}
            onNewRole={handleNewRole}
          />
        )}
      </div>
    </SettingsSectionCard>
  );
};

export default RolesPermissionsCard;
