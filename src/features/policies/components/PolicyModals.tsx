import { AnimatePresence } from "motion/react";
import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import { policyStatusColors } from "../constants/policies";
import type { CreatePolicyForm, DisplayPolicy, EditPolicyForm } from "../types";
import PolicyFormFields from "./PolicyFormFields";

type PolicyModalsProps = {
  createForm: CreatePolicyForm;
  editingPolicy: EditPolicyForm | null;
  isSubmitting: boolean;
  localizePolicyText: (value: string | null | undefined) => string;
  showCreateModal: boolean;
  showEditModal: boolean;
  showViewModal: boolean;
  viewingPolicy: DisplayPolicy | null;
  onCreateFormChange: (form: CreatePolicyForm) => void;
  onCreateSubmit: (event: React.FormEvent) => void;
  onEditFormChange: (form: EditPolicyForm) => void;
  onEditSubmit: (event: React.FormEvent) => void;
  onShowCreateModalChange: (show: boolean) => void;
  onShowEditModalChange: (show: boolean) => void;
  onShowViewModalChange: (show: boolean) => void;
};

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
  const handleCloseCreateModal = (): void => {
    onShowCreateModalChange(false);
  };

  const handleCloseEditModal = (): void => {
    onShowEditModalChange(false);
  };

  const handleCloseViewModal = (): void => {
    onShowViewModalChange(false);
  };

  return (
  <>
    <AnimatePresence>
      {showCreateModal && (
        <ModalOverlay
          onClose={handleCloseCreateModal}
          overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          contentClassName="bg-card border border-border/40 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          contentMotionProps={{
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {arabicSource("policies.add_a_new_policy")}
            </h2>
            <button
              onClick={handleCloseCreateModal}
              className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onCreateSubmit} className="space-y-4">
            <PolicyFormFields
              form={createForm}
              mode="create"
              onFormChange={onCreateFormChange}
            />
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {arabicSource("policies.create_the_policy")}
              </button>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                {arabicSource("common.cancel")}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showEditModal && editingPolicy && (
        <ModalOverlay
          onClose={handleCloseEditModal}
          overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          contentClassName="bg-card border border-border/40 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          contentMotionProps={{
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {arabicSource("policies.modify_the_policy")}
            </h2>
            <button
              onClick={handleCloseEditModal}
              className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onEditSubmit} className="space-y-4">
            <PolicyFormFields
              form={editingPolicy}
              mode="edit"
              onFormChange={onEditFormChange}
            />
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {arabicSource("policies.current_version")}{" "}
                <span className="text-foreground font-medium">
                  v{editingPolicy.version}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {arabicSource(
                  "policies.the_version_will_be_automatically_upgraded_upon_saving",
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {arabicSource("policies.save_the_modifications")}
              </button>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                {arabicSource("common.cancel")}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showViewModal && viewingPolicy && (
        <ModalOverlay
          onClose={handleCloseViewModal}
          overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          contentClassName="bg-card border border-border/40 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          contentMotionProps={{
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {localizePolicyText(viewingPolicy.title)}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {localizePolicyText(viewingPolicy.description)}
              </p>
            </div>
            <button
              onClick={handleCloseViewModal}
              className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/20">
              <div>
                <p className="text-muted-foreground text-sm">
                  {arabicSource("common.category")}
                </p>
                <p className="text-foreground font-medium">
                  {localizePolicyText(viewingPolicy.category)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {arabicSource("common.status")}
                </p>
                <p
                  className={`text-sm font-medium px-2 py-1 rounded-md border w-fit ${policyStatusColors[viewingPolicy.status]}`}
                >
                  {viewingPolicy.status}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {arabicSource("common.version")}
                </p>
                <p className="text-foreground font-medium">
                  v{viewingPolicy.version}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/10 rounded-lg border border-border/20">
              <p
                className="text-foreground whitespace-pre-wrap"
                style={{ lineHeight: 2 }}
              >
                {localizePolicyText(viewingPolicy.content)}
              </p>
            </div>

            <div className="pt-4 border-t border-border/20 text-xs text-muted-foreground">
              <p>
                {arabicSource("policies.latest_update_2")}{" "}
                {viewingPolicy.last_updated}
              </p>
              <p>
                {arabicSource("policies.created")} {viewingPolicy.created_at}
              </p>
            </div>

            <button
              onClick={handleCloseViewModal}
              className="w-full px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              {arabicSource("common.close")}
            </button>
          </div>
        </ModalOverlay>
      )}
    </AnimatePresence>
  </>
  );
};

export default PolicyModals;
