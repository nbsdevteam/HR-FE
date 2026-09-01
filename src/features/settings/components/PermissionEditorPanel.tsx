import { useCallback, type ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, LoadingState, StatusBadge } from "@/shared/components";
import type { HrPermissionsSchema } from "../api/permissionsAdmin";
import { useHrPermissionEditor } from "../hooks/useHrPermissionEditor";
import { useRolesPermissionsAccess } from "../hooks/useRolesPermissionsAccess";
import PermissionSectionGroup from "./PermissionSectionGroup";

type TPermissionEditorPanelProps = {
  userId: number;
  schema: HrPermissionsSchema | null;
  showToast: (message: string) => void;
  onBack: () => void;
  onSaved: () => void;
};

const PermissionEditorPanel = ({ userId, schema, showToast, onBack, onSaved }: TPermissionEditorPanelProps) => {
  const { canManage } = useRolesPermissionsAccess();
  const {
    detail,
    tree,
    notes,
    setNotes,
    loading,
    saving,
    resetting,
    isDirty,
    togglePermission,
    handleSave,
    handleReset,
  } = useHrPermissionEditor(userId, schema, showToast, onSaved);

  const handleNotesChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      setNotes(e.target.value);
    },
    [setNotes],
  );

  if (loading || !detail) {
    return <LoadingState message={arabicSource("common.loading")} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={onBack}>
          {arabicSource("settings.roles_permissions_back_to_directory")}
        </Button>
        {detail.has_individual_overrides && (
          <StatusBadge colorClassName="border-primary/30 bg-primary/10 text-primary">
            {arabicSource("settings.roles_permissions_custom_badge")}
          </StatusBadge>
        )}
      </div>

      <div>
        <h3 className="text-foreground" style={{ fontSize: 16, fontWeight: "var(--font-weight-medium)" }} data-i18n-ignore>
          {detail.name}
        </h3>
        <p className="text-muted-foreground" style={{ fontSize: 12 }} data-i18n-ignore>
          {detail.job_title} · {detail.email}
        </p>
        {detail.last_modified_by && (
          <p className="text-muted-foreground/70 mt-1" style={{ fontSize: 11 }}>
            {arabicSource("settings.roles_permissions_last_modified_by")} {detail.last_modified_by}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(tree).map(([section, actions]) => (
          <PermissionSectionGroup
            key={section}
            section={section}
            actions={actions}
            disabled={!canManage || saving || resetting}
            onToggle={togglePermission}
          />
        ))}
      </div>

      <div>
        <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
          {arabicSource("settings.roles_permissions_notes_label")}
        </label>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          disabled={!canManage || saving || resetting}
          rows={2}
          placeholder={arabicSource("settings.roles_permissions_notes_placeholder")}
          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none disabled:opacity-60"
          style={{ fontSize: 13 }}
        />
      </div>

      {canManage && (
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            onClick={handleReset}
            loading={resetting}
            disabled={saving}
          >
            {arabicSource("settings.roles_permissions_reset_to_default")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={resetting || !isDirty}
          >
            {arabicSource("common.save")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PermissionEditorPanel;
