import { useParams } from "react-router";
import { arabicSource } from "@/i18n/source";
import LoadingState from "@/shared/components/LoadingState";
import PublicLeaveNotice from "@/features/leave/components/PublicLeaveNotice";
import PublicLeaveShell from "@/features/leave/components/PublicLeaveShell";
import PublicExitSignForm from "../components/PublicExitSignForm";
import PublicExitSignSummary from "../components/PublicExitSignSummary";
import { usePublicExitSignPage } from "../hooks/usePublicExitSignPage";
import { CLOSED_LINK_KEYS } from "../utils/publicExitSign";

/**
 * No-login End of Service signing page — the leaving employee opens
 * `/exit-sign/:token` from the link HR shared, reviews what they are signing,
 * then signs with their typed name and a drawn signature, or declines. Rendered
 * outside the auth gate, like the public leave-request page.
 */
const PublicExitSign = () => {
  const { token = "" } = useParams();
  const page = usePublicExitSignPage(token);
  const { info, outcome } = page;

  if (page.loading && !info) {
    return (
      <PublicLeaveShell>
        <LoadingState message={arabicSource("common.loading")} variant="compact" />
      </PublicLeaveShell>
    );
  }

  if (page.loadErrorKey || !info) {
    return (
      <PublicLeaveShell>
        <PublicLeaveNotice
          tone="error"
          title={arabicSource("public_exit_sign.invalid_title")}
          body={arabicSource(page.loadErrorKey ?? "public_exit_sign.error_link_not_found")}
        />
      </PublicLeaveShell>
    );
  }

  if (outcome) {
    return (
      <PublicLeaveShell companyName={info.companyName}>
        <PublicLeaveNotice
          tone="info"
          title={arabicSource(outcome === "signed" ? "public_exit_sign.done_signed_title" : "public_exit_sign.done_declined_title")}
          body={arabicSource(outcome === "signed" ? "public_exit_sign.done_signed_body" : "public_exit_sign.done_declined_body")}
        />
      </PublicLeaveShell>
    );
  }

  if (info.state !== "sent" && info.state !== "viewed") {
    return (
      <PublicLeaveShell companyName={info.companyName}>
        <PublicLeaveNotice
          tone="info"
          title={arabicSource("public_exit_sign.closed_title")}
          body={arabicSource(CLOSED_LINK_KEYS[info.state] ?? "public_exit_sign.closed_revoked")}
        />
      </PublicLeaveShell>
    );
  }

  return (
    <PublicLeaveShell companyName={info.companyName}>
      <div className="space-y-5">
        <PublicExitSignSummary info={info} />
        <PublicExitSignForm
          typedName={page.typedName}
          notes={page.notes}
          submitting={page.submitting}
          errorKey={page.errorKey}
          onTypedNameChange={page.setTypedName}
          onNotesChange={page.setNotes}
          onSignatureChange={page.setSignature}
          onSign={page.handleSign}
          onDecline={page.handleDecline}
        />
      </div>
    </PublicLeaveShell>
  );
};

export default PublicExitSign;
