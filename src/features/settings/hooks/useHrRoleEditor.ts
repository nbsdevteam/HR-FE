import { useCallback, useEffect, useMemo, useState } from "react";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import {
  deleteHrRole,
  upsertHrRole,
  type HrPermissionsSchema,
  type HrPermissionTree,
  type HrRoleListItem,
  type HrRoleUpsertPayload,
} from "../api/permissionsAdmin";
import { buildPermissionTree } from "../utils/permissionTree";
import { roleErrorMessage } from "../utils/roleErrorMessage";

/**
 * Loads and edits one job-title role template. Per the backend hand-off,
 * `roles/list` already returns the complete `hr_permissions` tree, so unlike
 * `useHrPermissionEditor` there is no separate detail fetch — a `null` role
 * means "new role", seeded from a blank schema tree.
 */
export const useHrRoleEditor = (
  role: HrRoleListItem | null,
  schema: HrPermissionsSchema | null,
  showToast: (message: string) => void,
  onSaved: () => void,
) => {
  const [jobTitle, setJobTitle] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [tree, setTree] = useState<HrPermissionTree>({});
  const [initialTree, setInitialTree] = useState<HrPermissionTree>({});
  const [applyToAllUsers, setApplyToAllUsers] = useState(false);

  const saveMutation = useOdooMutation(
    (payload: HrRoleUpsertPayload) => upsertHrRole(payload),
    ["hrRoles", "hrAdminUsers"],
  );
  const deleteMutation = useOdooMutation(
    (jobTitle: string) => deleteHrRole(jobTitle),
    ["hrRoles", "hrAdminUsers"],
  );

  const isNew = role === null;
  const isHrOnly = role?.is_hr_only ?? true;

  const isDirty = useMemo(
    () =>
      isNew ||
      JSON.stringify(tree) !== JSON.stringify(initialTree) ||
      label !== role.label ||
      notes !== role.notes,
    [isNew, tree, initialTree, label, notes, role],
  );

  const loadRole = useCallback((): void => {
    if (!schema) return;
    const merged = buildPermissionTree(schema.hr_permission_tree, role?.hr_permissions);
    setJobTitle(role?.job_title ?? "");
    setLabel(role?.label ?? "");
    setNotes(role?.notes ?? "");
    setTree(merged);
    setInitialTree(merged);
    setApplyToAllUsers(false);
  }, [schema, role]);

  const togglePermission = useCallback((section: string, action: string): void => {
    setTree((prev) => ({
      ...prev,
      [section]: { ...prev[section], [action]: !prev[section]?.[action] },
    }));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!jobTitle.trim()) return;
    try {
      await saveMutation.mutateAsync({
        job_title: jobTitle.trim(),
        permissions: tree,
        label: label.trim() || jobTitle.trim(),
        notes,
        apply_to_all_users: applyToAllUsers,
      });
      showToast(arabicSource("settings.roles_permissions_save_success"));
      onSaved();
    } catch (e) {
      showToast(roleErrorMessage(e, arabicSource("settings.roles_permissions_save_error")));
    }
  }, [jobTitle, tree, label, notes, applyToAllUsers, saveMutation, showToast, onSaved]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (isNew) return;
    try {
      await deleteMutation.mutateAsync(jobTitle);
      showToast(arabicSource("settings.roles_permissions_delete_success"));
      onSaved();
    } catch (e) {
      showToast(roleErrorMessage(e, arabicSource("settings.roles_permissions_save_error")));
    }
  }, [isNew, jobTitle, deleteMutation, showToast, onSaved]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  return {
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
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    isDirty,
    togglePermission,
    handleSave,
    handleDelete,
  };
};
