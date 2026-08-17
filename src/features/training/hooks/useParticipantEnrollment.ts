import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { PARTICIPANT_STATUS_TO_ODOO } from "../constants/training";
import type { EnrollParticipantForm, ToastType } from "../types";

type UseParticipantEnrollmentArgs = {
  participantStatuses: string[];
  refetchParticipants: () => void;
  showToast: (type: ToastType, message: string) => void;
};

const buildInitialEnrollForm = (participantStatuses: string[]): EnrollParticipantForm => ({
  employee_id: "",
  completion_status: participantStatuses[0] || arabicSource("common.registered"),
  score: "",
});

export const useParticipantEnrollment = ({ participantStatuses, refetchParticipants, showToast }: UseParticipantEnrollmentArgs) => {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedProgramForParticipants, setSelectedProgramForParticipants] = useState<string | null>(null);
  const [enrollForm, setEnrollForm] = useState<EnrollParticipantForm>(buildInitialEnrollForm(participantStatuses));

  const updateEnrollForm = useCallback((patch: Partial<EnrollParticipantForm>) => {
    setEnrollForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const openEnrollModal = useCallback((programId: string) => {
    setSelectedProgramForParticipants(programId);
    setShowEnrollModal(true);
  }, []);

  const closeEnrollModal = useCallback(() => setShowEnrollModal(false), []);

  const handleEnrollParticipant = useCallback(async () => {
    if (!enrollForm.employee_id || !selectedProgramForParticipants) {
      showToast("error", arabicSource("training.please_select_an_employee"));
      return;
    }

    try {
      await odooData.createTrainingParticipant({
        training_program_id: selectedProgramForParticipants,
        employee_id: enrollForm.employee_id,
        completion_status: PARTICIPANT_STATUS_TO_ODOO[enrollForm.completion_status] || "enrolled",
        score: enrollForm.score ? parseInt(enrollForm.score) : null,
      });

      showToast("success", arabicSource("training.the_employee_has_been_successfully_registered_in_the_program"));
      setEnrollForm(buildInitialEnrollForm(participantStatuses));
      setShowEnrollModal(false);
      refetchParticipants();
    } catch {
      showToast("error", arabicSource("training.error_in_employee_registration"));
    }
  }, [enrollForm, participantStatuses, refetchParticipants, selectedProgramForParticipants, showToast]);

  const handleMarkCompleted = useCallback(async (participantId: string, score: number) => {
    try {
      await odooData.updateTrainingParticipant(participantId, {
        completion_status: "completed",
        score,
      });

      showToast("success", arabicSource("training.participant_status_has_been_updated"));
      refetchParticipants();
    } catch {
      showToast("error", arabicSource("training.update_error"));
    }
  }, [refetchParticipants, showToast]);

  const handleDeleteParticipant = useCallback(async (participantId: string) => {
    if (!localizedConfirm(arabicSource("training.do_you_want_to_delete_this_participant_from_the_program"))) return;

    try {
      await odooData.deleteTrainingParticipant(participantId);

      showToast("success", arabicSource("training.participant_has_been_successfully_deleted"));
      refetchParticipants();
    } catch {
      showToast("error", arabicSource("training.error_deleting_participant"));
    }
  }, [refetchParticipants, showToast]);

  return {
    showEnrollModal, openEnrollModal, closeEnrollModal,
    selectedProgramForParticipants,
    enrollForm, updateEnrollForm,
    handleEnrollParticipant, handleMarkCompleted, handleDeleteParticipant,
  };
};
