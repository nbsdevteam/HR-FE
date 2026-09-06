import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import type { DbTrainingProgram } from "@/shared/hooks";
import { runAsyncAction } from "@/shared/utils/asyncAction";
import { TRAINING_STATUS_TO_ODOO } from "../constants/training";
import type { CreateProgramForm, ToastType } from "../types";

type UseProgramFormArgs = {
  trainingCategories: string[];
  trainingStatuses: string[];
  defaultWeight: number;
  // No longer called directly: the create/update/delete mutations below
  // invalidate the "trainingPrograms"/"trainingParticipants" cache keys
  // themselves — kept in the type so existing callers can keep passing them
  // unchanged.
  refetchPrograms: () => void;
  refetchParticipants: () => void;
  showToast: (type: ToastType, message: string) => void;
};

const buildInitialCreateForm = (trainingCategories: string[], trainingStatuses: string[], defaultWeight: number): CreateProgramForm => ({
  title: "",
  category: trainingCategories[0] || arabicSource("common.business_objectives"),
  weight: `${defaultWeight}%`,
  instructor: "",
  duration: "",
  status: trainingStatuses[0] || arabicSource("common.is_coming"),
  max_participants: "",
  start_date: "",
  end_date: "",
  objectives: "",
});

export const useProgramForm = ({
  trainingCategories, trainingStatuses, defaultWeight, showToast,
}: UseProgramFormArgs) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DbTrainingProgram | null>(null);
  const [createForm, setCreateForm] = useState<CreateProgramForm>(
    buildInitialCreateForm(trainingCategories, trainingStatuses, defaultWeight),
  );
  const [pendingDeleteProgramId, setPendingDeleteProgramId] = useState<string | null>(null);
  const [deletingProgram, setDeletingProgram] = useState(false);

  const createProgramMutation = useOdooMutation<unknown, Record<string, unknown>>(
    (payload) => odooData.createTrainingProgram(payload),
    "trainingPrograms",
  );
  const updateProgramMutation = useOdooMutation<unknown, { id: string; payload: Record<string, unknown> }>(
    ({ id, payload }) => odooData.updateTrainingProgram(id, payload),
    "trainingPrograms",
  );
  const deleteProgramMutation = useOdooMutation<unknown, string>(
    (id) => odooData.deleteTrainingProgram(id),
    ["trainingPrograms", "trainingParticipants"],
  );

  const updateCreateForm = useCallback((patch: Partial<CreateProgramForm>) => {
    setCreateForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateEditingProgram = useCallback((patch: Partial<DbTrainingProgram>) => {
    setEditingProgram((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const openCreateModal = useCallback(() => setShowCreateModal(true), []);
  const closeCreateModal = useCallback(() => setShowCreateModal(false), []);
  const closeEditModal = useCallback(() => setEditingProgram(null), []);

  const handleCreateProgram = useCallback(async () => {
    if (!createForm.title || !createForm.category) {
      showToast("error", arabicSource("training.please_fill_in_the_required_data"));
      return;
    }

    await runAsyncAction(async () => {
      const objectives = createForm.objectives
        ? createForm.objectives.split("\n").filter((o) => o.trim())
        : [];

      const payload = {
        title: createForm.title,
        category: createForm.category,
        weight: createForm.weight,
        instructor: createForm.instructor || null,
        duration: createForm.duration || null,
        status: TRAINING_STATUS_TO_ODOO[createForm.status] || "planned",
        completion_rate: 0,
        max_participants: createForm.max_participants ? parseInt(createForm.max_participants) : null,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        objectives: objectives.length > 0 ? objectives : null,
      };

      await createProgramMutation.mutateAsync(payload);

      showToast("success", arabicSource("training.the_training_program_has_been_created_successfully"));
      setCreateForm(buildInitialCreateForm(trainingCategories, trainingStatuses, defaultWeight));
      setShowCreateModal(false);
    }, {
      onError: () => showToast("error", arabicSource("training.error_creating_the_program")),
    });
  }, [createForm, createProgramMutation, defaultWeight, showToast, trainingCategories, trainingStatuses]);

  const handleUpdateProgram = useCallback(async () => {
    if (!editingProgram) return;

    await runAsyncAction(async () => {
      const status = TRAINING_STATUS_TO_ODOO[editingProgram.status] || editingProgram.status;
      await updateProgramMutation.mutateAsync({
        id: editingProgram.id,
        payload: {
          status,
          completion_rate: editingProgram.completion_rate,
          instructor: editingProgram.instructor,
          duration: editingProgram.duration,
        },
      });

      showToast("success", arabicSource("training.the_software_has_been_updated_successfully"));
      setEditingProgram(null);
    }, {
      onError: () => showToast("error", arabicSource("training.software_update_error")),
    });
  }, [editingProgram, showToast, updateProgramMutation]);

  const requestDeleteProgram = useCallback((id: string) => {
    setPendingDeleteProgramId(id);
  }, []);

  const cancelDeleteProgram = useCallback(() => {
    setPendingDeleteProgramId(null);
  }, []);

  const confirmDeleteProgram = useCallback(async () => {
    if (!pendingDeleteProgramId) return;

    await runAsyncAction(async () => {
      await deleteProgramMutation.mutateAsync(pendingDeleteProgramId);

      showToast("success", arabicSource("training.the_program_was_deleted_successfully"));
    }, {
      setLoading: setDeletingProgram,
      onError: () => showToast("error", arabicSource("training.error_deleting_the_program")),
    });
    setPendingDeleteProgramId(null);
  }, [deleteProgramMutation, pendingDeleteProgramId, showToast]);

  return {
    showCreateModal, openCreateModal, closeCreateModal,
    editingProgram, setEditingProgram, updateEditingProgram, closeEditModal,
    createForm, updateCreateForm,
    handleCreateProgram, handleUpdateProgram,
    pendingDeleteProgramId, deletingProgram,
    requestDeleteProgram, cancelDeleteProgram, confirmDeleteProgram,
  };
};
