import { arabicSource } from "@/i18n/source";
import PublicLeaveStepIndicatorItem from "./PublicLeaveStepIndicatorItem";
import type { PublicLeaveStep } from "../types/publicLeave";

type PublicLeaveStepIndicatorProps = {
  currentStep: PublicLeaveStep;
  showVerify: boolean;
};

const BASE_STEPS: { id: PublicLeaveStep; labelKey: Parameters<typeof arabicSource>[0] }[] = [
  { id: "search", labelKey: "public_leave.step_search" },
  { id: "verify", labelKey: "public_leave.step_verify" },
  { id: "balances", labelKey: "public_leave.step_balances" },
  { id: "form", labelKey: "public_leave.step_form" },
  { id: "review", labelKey: "public_leave.step_review" },
  { id: "success", labelKey: "public_leave.step_success" },
];

/** Visible step progress for the request flow — accessibility requirement (backend hand-off §9). */
const PublicLeaveStepIndicator = ({ currentStep, showVerify }: PublicLeaveStepIndicatorProps) => {
  const steps = showVerify ? BASE_STEPS : BASE_STEPS.filter((s) => s.id !== "verify");
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-start mb-6" role="list" aria-label={arabicSource("public_leave.step_indicator_label")}>
      {steps.map((s, index) => (
        <PublicLeaveStepIndicatorItem
          key={s.id}
          label={arabicSource(s.labelKey)}
          index={index + 1}
          active={s.id === currentStep}
          done={currentIndex > -1 && index < currentIndex}
        />
      ))}
    </div>
  );
};

export default PublicLeaveStepIndicator;
