import { Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay } from "@/shared/components";
import {
  POLICY_MODAL_ACTIONS_CLASS,
  POLICY_MODAL_CONTENT_CLASS,
  POLICY_MODAL_HEADER_CLASS,
  POLICY_MODAL_MOTION_PROPS,
  POLICY_MODAL_OVERLAY_CLASS,
} from "../styles";
import type { CreatePolicyForm, PolicyFormPatch } from "../types";
import PolicyFormFields from "./PolicyFormFields";

export type PolicyCreateModalProps = {
  form: CreatePolicyForm;
  isSubmitting: boolean;
  onFormChange: (patch: PolicyFormPatch) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

const PolicyCreateModal = ({
  form,
  isSubmitting,
  onFormChange,
  onSubmit,
  onClose,
}: PolicyCreateModalProps) => (
  <ModalOverlay
    onClose={onClose}
    overlayClassName={POLICY_MODAL_OVERLAY_CLASS}
    contentClassName={POLICY_MODAL_CONTENT_CLASS}
    contentMotionProps={POLICY_MODAL_MOTION_PROPS}
  >
    <ModalHeader
      title={arabicSource("policies.add_a_new_policy")}
      onClose={onClose}
      className={POLICY_MODAL_HEADER_CLASS}
    />

    <form onSubmit={onSubmit} className="space-y-4">
      <PolicyFormFields form={form} mode="create" onFormChange={onFormChange} />
      <div className={POLICY_MODAL_ACTIONS_CLASS}>
        <Button type="submit" icon={Save} disabled={isSubmitting}>
          {arabicSource("policies.create_the_policy")}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          {arabicSource("common.cancel")}
        </Button>
      </div>
    </form>
  </ModalOverlay>
);

export default PolicyCreateModal;
