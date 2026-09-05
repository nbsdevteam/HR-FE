import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import {
  fetchHrUserPermissions,
  resetHrUserPermissions,
  setHrUserPermissions,
  type HrAdminUserPermissions,
  type HrAdminSetPermissionsResponse,
  type HrPermissionsSchema,
  type HrPermissionTree,
} from "../api/permissionsAdmin";
import { buildPermissionTree } from "../utils/permissionTree";

/**
 * Loads and edits one user's HR permission tree. Initialises from
 * `effective_permissions` (the merged, resolved state) per the backend
 * hand-off, not from `individual_overrides` — the latter is just the stored
 * delta, shown separately as a transparency badge.
 */
export const useHrPermissionEditor = (
  userId: number | null,
  schema: HrPermissionsSchema | null,
  showToast: (message: string) => void,
  onSaved: () => void,
) => {
  const [tree, setTree] = useState<HrPermissionTree>({});
  const [initialTree, setInitialTree] = useState<HrPermissionTree>({});
  const [notes, setNotes] = useState("");

  const detailQuery = useQuery<HrAdminUserPermissions, Error>({
    queryKey: ["hrUserPermissions", userId],
    queryFn: () => fetchHrUserPermissions(userId as number),
    enabled: userId !== null && !!schema,
  });
  const detail = detailQuery.data ?? null;

  const saveMutation = useOdooMutation(
    (payload: { userId: number; tree: HrPermissionTree; notes: string }) =>
      setHrUserPermissions(payload.userId, payload.tree, payload.notes),
    ["hrUserPermissions", "hrAdminUsers"],
  );

  const resetMutation = useOdooMutation(
    (targetUserId: number) => resetHrUserPermissions(targetUserId),
    ["hrUserPermissions", "hrAdminUsers"],
  );

  const isDirty = useMemo(
    () => JSON.stringify(tree) !== JSON.stringify(initialTree),
    [tree, initialTree],
  );

  const togglePermission = useCallback((section: string, action: string): void => {
    setTree((prev) => ({
      ...prev,
      [section]: { ...prev[section], [action]: !prev[section]?.[action] },
    }));
  }, []);

  const applyEffectivePermissions = useCallback(
    (result: HrAdminSetPermissionsResponse): void => {
      const merged = schema
        ? buildPermissionTree(schema.hr_permission_tree, result.effective_permissions)
        : {};
      setTree(merged);
      setInitialTree(merged);
    },
    [schema],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (userId === null) return;
    try {
      const result = await saveMutation.mutateAsync({ userId, tree, notes });
      applyEffectivePermissions(result);
      showToast(arabicSource("settings.roles_permissions_save_success"));
      onSaved();
    } catch (e: any) {
      showToast(e?.message || arabicSource("settings.roles_permissions_save_error"));
    }
  }, [userId, tree, notes, saveMutation, applyEffectivePermissions, showToast, onSaved]);

  const handleReset = useCallback(async (): Promise<void> => {
    if (userId === null) return;
    try {
      const result = await resetMutation.mutateAsync(userId);
      applyEffectivePermissions(result);
      setNotes("");
      showToast(arabicSource("settings.roles_permissions_reset_success"));
      onSaved();
    } catch (e: any) {
      showToast(e?.message || arabicSource("settings.roles_permissions_reset_error"));
    }
  }, [userId, resetMutation, applyEffectivePermissions, showToast, onSaved]);

  useEffect(() => {
    if (!detail || !schema) return;
    const merged = buildPermissionTree(schema.hr_permission_tree, detail.effective_permissions);
    setTree(merged);
    setInitialTree(merged);
    setNotes(detail.admin_notes ?? "");
  }, [detail, schema]);

  useEffect(() => {
    if (detailQuery.error) {
      showToast(detailQuery.error.message || arabicSource("settings.roles_permissions_load_error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.error]);

  return {
    detail,
    tree,
    notes,
    setNotes,
    loading: detailQuery.isFetching,
    saving: saveMutation.isPending,
    resetting: resetMutation.isPending,
    isDirty,
    togglePermission,
    handleSave,
    handleReset,
  };
};
