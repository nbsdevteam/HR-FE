import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import LoadingState from "@/shared/components/LoadingState";
import PublicLeaveBalanceList from "../components/PublicLeaveBalanceList";
import PublicLeaveEmployeeSearch from "../components/PublicLeaveEmployeeSearch";
import PublicLeaveNotice from "../components/PublicLeaveNotice";
import PublicLeaveRequestForm from "../components/PublicLeaveRequestForm";
import PublicLeaveReview from "../components/PublicLeaveReview";
import PublicLeaveShell from "../components/PublicLeaveShell";
import PublicLeaveStatusForm from "../components/PublicLeaveStatusForm";
import PublicLeaveStatusResult from "../components/PublicLeaveStatusResult";
import PublicLeaveStepIndicator from "../components/PublicLeaveStepIndicator";
import PublicLeaveSuccess from "../components/PublicLeaveSuccess";
import PublicLeaveVerifyForm from "../components/PublicLeaveVerifyForm";
import { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

const UNUSABLE_REASON_BODY_KEYS: Record<string, ArabicSourceKey> = {
  inactive: "public_leave.unusable_inactive",
  expired: "public_leave.unusable_expired",
  quota_reached: "public_leave.unusable_quota_reached",
  no_leave_types: "public_leave.unusable_no_leave_types",
};

const STEPS_WITH_INDICATOR = new Set(["search", "verify", "balances", "form", "review", "success"]);

/**
 * No-login leave-request page — an employee opens `/leave-request/:token`,
 * finds themselves, optionally verifies identity, sees their balances,
 * files a request, and gets a reference code back. Rendered outside the
 * auth gate, mirroring `PublicApply` (the equivalent `/apply/:token` flow).
 */
const PublicLeaveRequest = () => {
  const page = usePublicLeaveRequestPage();
  const { info, step } = page;

  if (info.loading) {
    return (
      <PublicLeaveShell>
        <LoadingState message={arabicSource("public_leave.loading")} variant="compact" />
      </PublicLeaveShell>
    );
  }

  if (info.loadError || !info.info) {
    return (
      <PublicLeaveShell>
        <PublicLeaveNotice
          tone="error"
          title={arabicSource("public_leave.invalid_link_title")}
          body={arabicSource("public_leave.invalid_link_body")}
        />
      </PublicLeaveShell>
    );
  }

  if (info.info.unusable_reason) {
    return (
      <PublicLeaveShell companyName={info.info.company_name}>
        <PublicLeaveNotice
          tone="error"
          title={arabicSource("public_leave.unusable_title")}
          body={arabicSource(UNUSABLE_REASON_BODY_KEYS[info.info.unusable_reason] || "public_leave.unusable_inactive")}
        />
      </PublicLeaveShell>
    );
  }

  return (
    <PublicLeaveShell companyName={info.info.company_name}>
      {STEPS_WITH_INDICATOR.has(step) && (
        <PublicLeaveStepIndicator currentStep={step} showVerify={info.info.verification_method !== "none"} />
      )}

      {step === "search" && <PublicLeaveEmployeeSearch page={page} />}
      {step === "verify" && <PublicLeaveVerifyForm page={page} />}
      {step === "balances" && <PublicLeaveBalanceList page={page} />}
      {step === "form" && <PublicLeaveRequestForm page={page} />}
      {step === "review" && <PublicLeaveReview page={page} />}
      {step === "success" && <PublicLeaveSuccess page={page} />}
      {step === "track" && (
        page.trackStatus.statuses
          ? <PublicLeaveStatusResult statuses={page.trackStatus.statuses} onBack={page.handleBackFromTrack} />
          : <PublicLeaveStatusForm page={page} />
      )}
    </PublicLeaveShell>
  );
};

export default PublicLeaveRequest;
