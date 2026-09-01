import { useCallback, useState, type ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, ConfirmDeleteModal, InputField, LoadingState } from "@/shared/components";
import type { HrPermissionsSchema, HrRoleListItem } from "../api/permissionsAdmin";
import { useHrRoleEditor } from "../hooks/useHrRoleEditor";
import PermissionSectionGroup from "./PermissionSectionGroup";

type TJobRoleEditorPanelProps = {
  role: HrRoleListItem | null;
  schema: HrPermissionsSchema | null;
  canManage: boolean;
  showToast: (message: string) => void;
  onBack: () => void;
  onSaved: () => void;
};

const JobRoleEditorPanel = ({ role, schema, canManage, showToast, onBack, onSaved }: TJobRoleEditorPanelProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const {
    isNew,
    isHrOnly,
    jobTitle,
    setJobTitle,
    label,
    setLabel,
    notes,
    setNotes,
    tree,
    applyToAllUsers,
    setApplyToAllUsers,
    saving,
    deleting,
    isDirty,
    togglePermission,
    handleSave,
    handleDelete,
  } = useHrRoleEditor(role, schema, showToast, onSaved);

  const handleApplyToAllChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setApplyToAllUsers(e.target.checked);
    },
    [setApplyToAllUsers],
  );

  const handleNotesChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      setNotes(e.target.value);
    },
    [setNotes],
  );

  const handleOpenDeleteConfirm = useCallback((): void => {
    setConfirmingDelete(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback((): void => {
    setConfirmingDelete(false);
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    handleDelete();
  }, [handleDelete]);

  if (!schema) {
    return <LoadingState message={arabicSource("common.loading")} />;
  }

  const disabled = !canManage || saving || deleting;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={onBack}>
          {arabicSource("settings.roles_permissions_back_to_directory")}
        </Button>
      </div>

      {!isHrOnly && (
        <p className="text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2" style={{ fontSize: 12 }}>
          {arabicSource("settings.roles_permissions_shared_role_notice")}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isNew ? (
          <InputField
            label={arabicSource("settings.roles_permissions_role_form_job_title_label")}
            value={jobTitle}
            onChange={setJobTitle}
            className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary"
          />
        ) : (
          <div>
            <label className="block text-foreground text-sm mb-2">
              {arabicSource("settings.roles_permissions_role_form_job_title_label")}
            </label>
            <p
              className="w-full h-10 px-3 flex items-center rounded-lg border border-border/40 bg-muted/10 text-muted-foreground text-sm"
              data-i18n-ignore
            >
              {jobTitle}
            </p>
          </div>
        )}
        <InputField
          label={arabicSource("settings.roles_permissions_role_form_label_label")}
          value={label}
          onChange={setLabel}
          className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(tree).map(([section, actions]) => (
          <PermissionSectionGroup
            key={section}
            section={section}
            actions={actions}
            disabled={disabled}
            onToggle={togglePermission}
          />
        ))}
      </div>

      <div>
        <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
          {arabicSource("settings.roles_permissions_role_form_notes_label")}
        </label>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          disabled={disabled}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none disabled:opacity-60"
          style={{ fontSize: 13 }}
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer text-foreground" style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={applyToAllUsers}
            onChange={handleApplyToAllChange}
            disabled={disabled}
            className="accent-primary"
          />
          {arabicSource("settings.roles_permissions_apply_to_all_label")}
        </label>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
          {arabicSource("settings.roles_permissions_apply_to_all_hint")}
        </p>
      </div>

      {canManage && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
          {!isNew && isHrOnly ? (
            <Button variant="destructive" size="sm" onClick={handleOpenDeleteConfirm} disabled={saving || deleting}>
              {arabicSource("settings.roles_permissions_delete_role")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={deleting || !isDirty || !jobTitle.trim()}
          >
            {arabicSource("common.save")}
          </Button>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDeleteModal
          onClose={handleCloseDeleteConfirm}
          onConfirm={handleConfirmDelete}
          title={arabicSource("settings.roles_permissions_delete_role_confirm_title")}
          message={arabicSource("settings.roles_permissions_delete_role_confirm_message")}
          confirmLabel={arabicSource("settings.roles_permissions_delete_role")}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default JobRoleEditorPanel;
