import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { localizedConfirm } from "@/i18n/native";
import { type DbLeaveLink, useOdooMutation } from "@/shared/hooks";
import type { LeaveLinkFormState } from "../types";

const EMPTY_FORM: LeaveLinkFormState = {
  name: "",
  active: true,
  expires_on: "",
  max_submissions: 0,
  require_verification: "none",
  allow_attachments: true,
  leave_type_ids: [],
  department_ids: [],
};

const linkToForm = (link: DbLeaveLink): LeaveLinkFormState => ({
  name: link.name,
  active: link.active,
  expires_on: link.expires_on || "",
  max_submissions: link.max_submissions,
  require_verification: link.require_verification,
  allow_attachments: link.allow_attachments,
  leave_type_ids: link.leave_type_ids,
  department_ids: link.department_ids,
});

/**
 * `refetchLinks` is `useLeaveLinks()`'s own TanStack Query refetch — kept in
 * the signature since `PublicLeaveLinksCard` still passes it, but no longer
 * called after a mutation: `saveLinkMutation`/`deleteLinkMutation`/
 * `rotateLinkMutation` invalidate the `"leaveLinks"` query key themselves,
 * which refetches this same hook.
 */
export const useLeaveLinkManagement = (refetchLinks: () => void, showToast: (message: string) => void) => {
  const [editingLink, setEditingLink] = useState<DbLeaveLink | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LeaveLinkFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const saveLinkMutation = useOdooMutation(
    (vars: { id?: string; payload: Record<string, unknown> }) =>
      vars.id ? odooData.updateLeaveLink(vars.id, vars.payload) : odooData.createLeaveLink(vars.payload),
    "leaveLinks",
  );
  const deleteLinkMutation = useOdooMutation(
    (linkId: string) => odooData.deleteLeaveLink(linkId),
    "leaveLinks",
  );
  const rotateLinkMutation = useOdooMutation(
    (linkId: string) => odooData.rotateLeaveLink(linkId),
    "leaveLinks",
  );

  const updateForm = useCallback((patch: Partial<LeaveLinkFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingLink(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((link: DbLeaveLink) => {
    setEditingLink(link);
    setForm(linkToForm(link));
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const saveLink = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        active: form.active,
        expires_on: form.expires_on || false,
        max_submissions: form.max_submissions,
        require_verification: form.require_verification,
        allow_attachments: form.allow_attachments,
        leave_type_ids: form.leave_type_ids.map(Number),
        department_ids: form.department_ids.map(Number),
      };
      await saveLinkMutation.mutateAsync({ id: editingLink?.id, payload });
      setShowForm(false);
    } catch (e: any) {
      showToast(e?.message || arabicSource("settings.leave_links_save_error"));
    }
    setSaving(false);
  }, [editingLink, form, saveLinkMutation, showToast]);

  const deleteLink = useCallback(async (link: DbLeaveLink) => {
    try {
      await deleteLinkMutation.mutateAsync(link.id);
    } catch (e: any) {
      showToast(e?.message || arabicSource("settings.leave_links_delete_error"));
    }
  }, [deleteLinkMutation, showToast]);

  const rotateLink = useCallback(async (link: DbLeaveLink) => {
    if (!localizedConfirm(arabicSource("settings.leave_links_rotate_confirm"))) return;
    try {
      await rotateLinkMutation.mutateAsync(link.id);
    } catch (e: any) {
      showToast(e?.message || arabicSource("settings.leave_links_rotate_error"));
    }
  }, [rotateLinkMutation, showToast]);

  return {
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
  };
};
