import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay } from "@/shared/components";
import { policyStatusColors } from "../constants/policies";
import {
  POLICY_MODAL_HEADER_CLASS,
  POLICY_MODAL_MOTION_PROPS,
  POLICY_MODAL_OVERLAY_CLASS,
  POLICY_MODAL_WIDE_CONTENT_CLASS,
} from "../styles";
import type { DisplayPolicy } from "../types";
import PolicyViewMetaField from "./PolicyViewMetaField";

export type PolicyViewModalProps = {
  policy: DisplayPolicy;
  localizePolicyText: (value: string | null | undefined) => string;
  onClose: () => void;
};

const PolicyViewModal = ({ policy, localizePolicyText, onClose }: PolicyViewModalProps) => (
  <ModalOverlay
    onClose={onClose}
    overlayClassName={POLICY_MODAL_OVERLAY_CLASS}
    contentClassName={POLICY_MODAL_WIDE_CONTENT_CLASS}
    contentMotionProps={POLICY_MODAL_MOTION_PROPS}
  >
    <ModalHeader
      title={
        <span className="text-2xl font-bold text-foreground">
          {localizePolicyText(policy.title)}
        </span>
      }
      subtitle={
        <span className="text-muted-foreground text-sm">
          {localizePolicyText(policy.description)}
        </span>
      }
      onClose={onClose}
      className={POLICY_MODAL_HEADER_CLASS}
    />

    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/20">
        <PolicyViewMetaField label={arabicSource("common.category")}>
          <p className="text-foreground font-medium">{localizePolicyText(policy.category)}</p>
        </PolicyViewMetaField>
        <PolicyViewMetaField label={arabicSource("common.status")}>
          <p
            className={`text-sm font-medium px-2 py-1 rounded-md border w-fit ${policyStatusColors[policy.status]}`}
          >
            {policy.status}
          </p>
        </PolicyViewMetaField>
        <PolicyViewMetaField label={arabicSource("common.version")}>
          <p className="text-foreground font-medium">v{policy.version}</p>
        </PolicyViewMetaField>
      </div>

      <div className="p-4 bg-muted/10 rounded-lg border border-border/20">
        <p className="text-foreground whitespace-pre-wrap" style={{ lineHeight: 2 }}>
          {localizePolicyText(policy.content)}
        </p>
      </div>

      <div className="pt-4 border-t border-border/20 text-xs text-muted-foreground">
        <p>
          {arabicSource("policies.latest_update_2")} {policy.last_updated}
        </p>
        <p>
          {arabicSource("policies.created")} {policy.created_at}
        </p>
      </div>

      <Button variant="secondary" onClick={onClose} className="w-full">
        {arabicSource("common.close")}
      </Button>
    </div>
  </ModalOverlay>
);

export default PolicyViewModal;
