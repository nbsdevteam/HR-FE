import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import type { CreatePolicyForm, DisplayPolicy, EditPolicyForm, PolicyFormPatch } from "../types";
import PolicyCreateModal from "./PolicyCreateModal";
import PolicyEditModal from "./PolicyEditModal";
import PolicyViewModal from "./PolicyViewModal";

type PolicyModalsProps = {
  createForm: CreatePolicyForm;
  editingPolicy: EditPolicyForm | null;
  isSubmitting: boolean;
  localizePolicyText: (value: string | null | undefined) => string;
  showCreateModal: boolean;
  showEditModal: boolean;
  showViewModal: boolean;
  viewingPolicy: DisplayPolicy | null;
  onCreateFormChange: (patch: PolicyFormPatch) => void;
  onCreateSubmit: (event: React.FormEvent) => void;
  onEditFormChange: (patch: PolicyFormPatch) => void;
  onEditSubmit: (event: React.FormEvent) => void;
  onShowCreateModalChange: (show: boolean) => void;
  onShowEditModalChange: (show: boolean) => void;
  onShowViewModalChange: (show: boolean) => void;
};

/** Mounts the three policy dialogs; each one owns its own markup. */
const PolicyModals = ({
  createForm,
  editingPolicy,
  isSubmitting,
  localizePolicyText,
  showCreateModal,
  showEditModal,
  showViewModal,
  viewingPolicy,
  onCreateFormChange,
  onCreateSubmit,
  onEditFormChange,
  onEditSubmit,
  onShowCreateModalChange,
  onShowEditModalChange,
  onShowViewModalChange,
}: PolicyModalsProps) => {
  const handleCloseCreateModal = useCallback((): void => {
    onShowCreateModalChange(false);
  }, [onShowCreateModalChange]);

  const handleCloseEditModal = useCallback((): void => {
    onShowEditModalChange(false);
  }, [onShowEditModalChange]);

  const handleCloseViewModal = useCallback((): void => {
    onShowViewModalChange(false);
  }, [onShowViewModalChange]);

  return (
    <>
      <AnimatePresence>
        {showCreateModal && (
          <PolicyCreateModal
            form={createForm}
            isSubmitting={isSubmitting}
            onFormChange={onCreateFormChange}
            onSubmit={onCreateSubmit}
            onClose={handleCloseCreateModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editingPolicy && (
          <PolicyEditModal
            policy={editingPolicy}
            isSubmitting={isSubmitting}
            onFormChange={onEditFormChange}
            onSubmit={onEditSubmit}
            onClose={handleCloseEditModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && viewingPolicy && (
          <PolicyViewModal
            policy={viewingPolicy}
            localizePolicyText={localizePolicyText}
            onClose={handleCloseViewModal}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PolicyModals;
