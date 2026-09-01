import { useCallback, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useHrPermissionsAdmin } from "../hooks/useHrPermissionsAdmin";
import { useRolesPermissionsAccess } from "../hooks/useRolesPermissionsAccess";
import PermissionEditorPanel from "./PermissionEditorPanel";
import RolesPermissionsDirectory from "./RolesPermissionsDirectory";
import SettingsSectionCard from "./SettingsSectionCard";

type TRolesPermissionsCardProps = {
  showToast: (message: string) => void;
};

const WIDE_MODAL_CLASS =
  "bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col overflow-hidden";

const RolesPermissionsCard = ({ showToast }: TRolesPermissionsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { canView } = useRolesPermissionsAccess();
  const { schema, items, total, search, setSearch, role, setRole, loading, forbidden, refetch } =
    useHrPermissionsAdmin(isOpen);

  const handleDialogOpen = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const handleDialogClose = useCallback((): void => {
    setIsOpen(false);
    setSelectedUserId(null);
  }, []);

  const handleSelectUser = useCallback((userId: number): void => {
    setSelectedUserId(userId);
  }, []);

  const handleBackToDirectory = useCallback((): void => {
    setSelectedUserId(null);
  }, []);

  if (!canView) return null;

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
      {selectedUserId !== null ? (
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
      )}
    </SettingsSectionCard>
  );
};

export default RolesPermissionsCard;
