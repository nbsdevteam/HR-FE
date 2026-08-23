import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { PositionFormState } from "../components/PositionFormModal";
import { EMPTY_POSITION_FORM } from "./usePositionsView";

type UseAddPositionFormArgs = {
  refetchPositions: () => Promise<void> | void;
  setToast: Dispatch<SetStateAction<string | null>>;
};

/**
 * The "New position" dialog reachable from the hierarchy header: its form
 * state, its own saving flag, and the create call.
 */
export const useAddPositionForm = ({
  refetchPositions,
  setToast,
}: UseAddPositionFormArgs) => {
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [positionSaving, setPositionSaving] = useState(false);
  const [posForm, setPosForm] = useState<PositionFormState>(
    EMPTY_POSITION_FORM,
  );

  const openAddPositionModal = useCallback(() => {
    setPosForm(EMPTY_POSITION_FORM);
    setShowAddPositionModal(true);
  }, []);

  const closeAddPositionModal = useCallback(() => {
    setShowAddPositionModal(false);
  }, []);

  const handleAddPositionSubmit = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setPositionSaving(true);
    try {
      await odooData.createDesignation({
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        reports_to_job_id: null,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
        level: 0,
      });
      setToast(arabicSource("hierarchy.the_position_was_created_successfully"));
      setShowAddPositionModal(false);
      setPosForm(EMPTY_POSITION_FORM);
      await refetchPositions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    }
    setPositionSaving(false);
  }, [posForm, refetchPositions, setToast]);

  return {
    showAddPositionModal,
    positionSaving,
    posForm,
    setPosForm,
    openAddPositionModal,
    closeAddPositionModal,
    handleAddPositionSubmit,
  };
};
