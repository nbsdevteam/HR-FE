import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbDocumentType } from "@/shared/hooks";
import { INITIAL_NEW_DOC_TYPE } from "../constants/settings";
import type { NewDocTypeForm } from "../types";

export const useDocumentTypeManagement = (refetchDocumentTypes: () => void, showToast: (message: string) => void) => {
  const [showNewDocTypeForm, setShowNewDocTypeForm] = useState(false);
  const [newDocType, setNewDocType] = useState<NewDocTypeForm>({ ...INITIAL_NEW_DOC_TYPE });

  const updateNewDocType = useCallback((patch: Partial<NewDocTypeForm>) => {
    setNewDocType((prev) => ({ ...prev, ...patch }));
  }, []);

  const createDocumentTypeEntry = useCallback(async () => {
    try {
      await odooData.createDocumentType({
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
  }, [newDocType, refetchDocumentTypes, showToast]);

  const toggleDocumentTypeActive = useCallback(async (documentType: DbDocumentType) => {
    try {
      await odooData.updateDocumentType(documentType.id, { active: !documentType.is_active });
      await refetchDocumentTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to update document type");
    }
  }, [refetchDocumentTypes, showToast]);

  const deleteDocumentTypeEntry = useCallback(async (documentTypeId: string) => {
    try {
      await odooData.deleteDocumentType(documentTypeId);
      await refetchDocumentTypes();
    } catch (e: any) {
      showToast(e?.message || "Failed to delete document type");
    }
  }, [refetchDocumentTypes, showToast]);

  return {
    showNewDocTypeForm, setShowNewDocTypeForm,
    newDocType, updateNewDocType,
    createDocumentTypeEntry, toggleDocumentTypeActive, deleteDocumentTypeEntry,
  };
};
