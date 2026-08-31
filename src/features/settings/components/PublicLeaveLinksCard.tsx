import { useCallback, useState } from "react";
import { Link2, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ConfirmDeleteModal } from "@/shared/components";
import { useLeaveLinks, type DbLeaveLink } from "@/shared/hooks";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useLeaveLinkManagement } from "../hooks/useLeaveLinkManagement";
import LeaveLinkFormModal from "./LeaveLinkFormModal";
import LeaveLinkList from "./LeaveLinkList";
import SettingsSectionCard from "./SettingsSectionCard";

type PublicLeaveLinksCardProps = {
  showToast: (message: string) => void;
};

/**
 * HR-side management of `/leave-request/:token` links (backend hand-off §8)
 * — same slot as `LeaveTypesCard`/`PublicHolidaysCard`: a flat list of a
 * handful of config records, not a per-employee or per-request screen.
 */
const PublicLeaveLinksCard = ({ showToast }: PublicLeaveLinksCardProps) => {
  const { links, loading, refetch } = useLeaveLinks();
  const { departments, leaveTypes } = useSettingsBootstrap();
  const [linkPendingDelete, setLinkPendingDelete] = useState<DbLeaveLink | null>(null);
  const {
    closeForm,
    deleteLink,
    editingLink,
    form,
    openCreateForm,
    openEditForm,
    rotateLink,
    saveLink,
    saving,
    showForm,
    updateForm,
  } = useLeaveLinkManagement(refetch, showToast);

  const handleAddClick = useCallback((): void => {
    openCreateForm();
  }, [openCreateForm]);

  const handleCancelDelete = useCallback((): void => {
    setLinkPendingDelete(null);
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    if (!linkPendingDelete) return;
    void deleteLink(linkPendingDelete);
    setLinkPendingDelete(null);
  }, [deleteLink, linkPendingDelete]);

  const actions = (
    <button
      onClick={handleAddClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs transition-colors cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      {arabicSource("settings.leave_links_add")}
    </button>
  );

  return (
    <SettingsSectionCard
      icon={Link2}
      title={arabicSource("settings.leave_links_title")}
      description={arabicSource("settings.leave_links_subtitle")}
      actions={actions}
      delay={0.08}
    >
      <LeaveLinkList
        links={loading ? [] : links}
        onDelete={setLinkPendingDelete}
        onEdit={openEditForm}
        onRotate={rotateLink}
      />

      {showForm && (
        <LeaveLinkFormModal
          departments={departments}
          form={form}
          isEditing={Boolean(editingLink)}
          leaveTypes={leaveTypes}
          saving={saving}
          onCancel={closeForm}
          onFieldChange={updateForm}
          onSave={saveLink}
        />
      )}

      {linkPendingDelete && (
        <ConfirmDeleteModal
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title={arabicSource("settings.leave_links_delete_confirm_title")}
          message={arabicSource("settings.leave_links_delete_confirm_body")}
        />
      )}
    </SettingsSectionCard>
  );
};

export default PublicLeaveLinksCard;
