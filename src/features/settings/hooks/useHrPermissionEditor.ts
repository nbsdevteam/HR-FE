import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHrUserPermissions,
  resetHrUserPermissions,
  setHrUserPermissions,
  type HrAdminUserPermissions,
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
  const [detail, setDetail] = useState<HrAdminUserPermissions | null>(null);
  const [tree, setTree] = useState<HrPermissionTree>({});
  const [initialTree, setInitialTree] = useState<HrPermissionTree>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(tree) !== JSON.stringify(initialTree),
    [tree, initialTree],
  );

  const loadDetail = useCallback(async (): Promise<void> => {
    if (userId === null || !schema) return;
    setLoading(true);
    try {
      const data = await fetchHrUserPermissions(userId);
      const merged = buildPermissionTree(schema.hr_permission_tree, data.effective_permissions);
      setDetail(data);
      setTree(merged);
      setInitialTree(merged);
      setNotes(data.admin_notes ?? "");
    } catch (e: any) {
      showToast(e?.message || "تعذر تحميل صلاحيات المستخدم");
    } finally {
      setLoading(false);
    }
  }, [userId, schema, showToast]);

  const togglePermission = useCallback((section: string, action: string): void => {
    setTree((prev) => ({
      ...prev,
      [section]: { ...prev[section], [action]: !prev[section]?.[action] },
    }));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (userId === null) return;
    setSaving(true);
    try {
      const result = await setHrUserPermissions(userId, tree, notes);
      const merged = schema
        ? buildPermissionTree(schema.hr_permission_tree, result.effective_permissions)
        : tree;
      setTree(merged);
      setInitialTree(merged);
      showToast("تم حفظ الصلاحيات");
      onSaved();
    } catch (e: any) {
      showToast(e?.message || "تعذر حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  }, [userId, tree, notes, schema, showToast, onSaved]);

  const handleReset = useCallback(async (): Promise<void> => {
    if (userId === null) return;
    setResetting(true);
    try {
      const result = await resetHrUserPermissions(userId);
      const merged = schema
        ? buildPermissionTree(schema.hr_permission_tree, result.effective_permissions)
        : {};
      setTree(merged);
      setInitialTree(merged);
      setNotes("");
      showToast("تمت إعادة الضبط للافتراضي");
      onSaved();
    } catch (e: any) {
      showToast(e?.message || "تعذر إعادة الضبط");
    } finally {
      setResetting(false);
    }
  }, [userId, schema, showToast, onSaved]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  return {
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
  };
};
