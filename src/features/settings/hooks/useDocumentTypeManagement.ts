import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { type DbDocumentType, useOdooMutation } from "@/shared/hooks";
import { INITIAL_NEW_DOC_TYPE } from "../constants/settings";
import type { NewDocTypeForm } from "../types";

/**
 * `refetchDocumentTypes` is `useSettingsBootstrap()`'s whole-bundle refetch,
 * not the `"documentTypes"`-keyed query these mutations invalidate, so it stays.
 */
export const useDocumentTypeManagement = (refetchDocumentTypes: () => void, showToast: (message: string) => void) => {
  const [showNewDocTypeForm, setShowNewDocTypeForm] = useState(false);
  const [newDocType, setNewDocType] = useState<NewDocTypeForm>({ ...INITIAL_NEW_DOC_TYPE });

  const createDocumentTypeMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createDocumentType(payload),
    "documentTypes",
  );
  const updateDocumentTypeMutation = useOdooMutation(
    ({ documentTypeId, patch }: { documentTypeId: string; patch: Record<string, unknown> }) =>
      odooData.updateDocumentType(documentTypeId, patch),
    "documentTypes",
  );
  const deleteDocumentTypeMutation = useOdooMutation(
    (documentTypeId: string) => odooData.deleteDocumentType(documentTypeId),
    "documentTypes",
  );

  const updateNewDocType = useCallback((patch: Partial<NewDocTypeForm>) => {
    setNewDocType((prev) => ({ ...prev, ...patch }));
  }, []);

  const createDocumentTypeEntry = useCallback(async () => {
    try {
      await createDocumentTypeMutation.mutateAsync({
        name: newDocType.name_ar || newDocType.name_en,
        code: newDocType.code,
        sequence: newDocType.sort_order || 10,
        active: true,
      });
      setShowNewDocTypeForm(false);
      await refetchDocumentTypes();
      showToast("Saved");
    } catch (e: any) {
      showToast(e?.message || "Failed to create document type");
    }
  }, [createDocumentTypeMutation, newDocType, refetchDocumentTypes, showToast]);

  const toggleDocumentTypeActive = useCallback(async (documentType: DbDocumentType) => {
    try {
      await updateDocumentTypeMutation.mutateAsync({
        documentTypeId: documentType.id,
        patch: { active: !documentType.is_active },
      });
      await refetchDocumentTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to update document type");
    }
  }, [refetchDocumentTypes, showToast, updateDocumentTypeMutation]);

  const deleteDocumentTypeEntry = useCallback(async (documentTypeId: string) => {
    try {
      await deleteDocumentTypeMutation.mutateAsync(documentTypeId);
      await refetchDocumentTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to delete document type");
    }
  }, [deleteDocumentTypeMutation, refetchDocumentTypes, showToast]);

  return {
    showNewDocTypeForm, setShowNewDocTypeForm,
    newDocType, updateNewDocType,
    createDocumentTypeEntry, toggleDocumentTypeActive, deleteDocumentTypeEntry,
  };
};
