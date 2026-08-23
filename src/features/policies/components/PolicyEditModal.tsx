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
import type { EditPolicyForm, PolicyFormPatch } from "../types";
import PolicyFormFields from "./PolicyFormFields";

export type PolicyEditModalProps = {
  policy: EditPolicyForm;
  isSubmitting: boolean;
  onFormChange: (patch: PolicyFormPatch) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

const PolicyEditModal = ({
  policy,
  isSubmitting,
  onFormChange,
  onSubmit,
  onClose,
}: PolicyEditModalProps) => (
  <ModalOverlay
    onClose={onClose}
    overlayClassName={POLICY_MODAL_OVERLAY_CLASS}
    contentClassName={POLICY_MODAL_CONTENT_CLASS}
    contentMotionProps={POLICY_MODAL_MOTION_PROPS}
  >
    <ModalHeader
      title={arabicSource("policies.modify_the_policy")}
      onClose={onClose}
      className={POLICY_MODAL_HEADER_CLASS}
    />

    <form onSubmit={onSubmit} className="space-y-4">
      <PolicyFormFields form={policy} mode="edit" onFormChange={onFormChange} />
      <div className="p-3 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {arabicSource("policies.current_version")}{" "}
          <span className="text-foreground font-medium">v{policy.version}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {arabicSource("policies.the_version_will_be_automatically_upgraded_upon_saving")}
        </p>
      </div>
      <div className={POLICY_MODAL_ACTIONS_CLASS}>
        <Button type="submit" icon={Save} disabled={isSubmitting}>
          {arabicSource("policies.save_the_modifications")}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          {arabicSource("common.cancel")}
        </Button>
      </div>
    </form>
  </ModalOverlay>
);

export default PolicyEditModal;
