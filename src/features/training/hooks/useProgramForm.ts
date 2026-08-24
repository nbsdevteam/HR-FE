import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { DbTrainingProgram } from "@/shared/hooks";
import { runAsyncAction } from "@/shared/utils/asyncAction";
import { TRAINING_STATUS_TO_ODOO } from "../constants/training";
import type { CreateProgramForm, ToastType } from "../types";

type UseProgramFormArgs = {
  trainingCategories: string[];
  trainingStatuses: string[];
  defaultWeight: number;
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
  trainingCategories, trainingStatuses, defaultWeight, refetchPrograms, refetchParticipants, showToast,
}: UseProgramFormArgs) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DbTrainingProgram | null>(null);
  const [createForm, setCreateForm] = useState<CreateProgramForm>(
    buildInitialCreateForm(trainingCategories, trainingStatuses, defaultWeight),
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

      await odooData.createTrainingProgram(payload);

      showToast("success", arabicSource("training.the_training_program_has_been_created_successfully"));
      setCreateForm(buildInitialCreateForm(trainingCategories, trainingStatuses, defaultWeight));
      setShowCreateModal(false);
      refetchPrograms();
    }, {
      onError: () => showToast("error", arabicSource("training.error_creating_the_program")),
    });
  }, [createForm, defaultWeight, refetchPrograms, showToast, trainingCategories, trainingStatuses]);

  const handleUpdateProgram = useCallback(async () => {
    if (!editingProgram) return;

    await runAsyncAction(async () => {
      const status = TRAINING_STATUS_TO_ODOO[editingProgram.status] || editingProgram.status;
      await odooData.updateTrainingProgram(editingProgram.id, {
        status,
        completion_rate: editingProgram.completion_rate,
        instructor: editingProgram.instructor,
        duration: editingProgram.duration,
      });

      showToast("success", arabicSource("training.the_software_has_been_updated_successfully"));
      setEditingProgram(null);
      refetchPrograms();
    }, {
      onError: () => showToast("error", arabicSource("training.software_update_error")),
    });
  }, [editingProgram, refetchPrograms, showToast]);

  const handleDeleteProgram = useCallback(async (id: string) => {
    if (!localizedConfirm(arabicSource("training.do_you_want_to_delete_this_training_program"))) return;

    await runAsyncAction(async () => {
      await odooData.deleteTrainingProgram(id);

      showToast("success", arabicSource("training.the_program_was_deleted_successfully"));
      refetchPrograms();
      refetchParticipants();
    }, {
      onError: () => showToast("error", arabicSource("training.error_deleting_the_program")),
    });
  }, [refetchParticipants, refetchPrograms, showToast]);

  return {
    showCreateModal, openCreateModal, closeCreateModal,
    editingProgram, setEditingProgram, updateEditingProgram, closeEditModal,
    createForm, updateCreateForm,
    handleCreateProgram, handleUpdateProgram, handleDeleteProgram,
  };
};
