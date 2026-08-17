import { arabicSource } from "@/i18n/source";
import PublicApplyForm from "../components/PublicApplyForm";
import LoadingState from "@/shared/components/LoadingState";
import PublicApplyNotice from "../components/PublicApplyNotice";
import PublicApplyShell from "../components/PublicApplyShell";
import PublicApplySuccess from "../components/PublicApplySuccess";
import { usePublicApplyPage } from "../hooks/usePublicApplyPage";

/**
 * Candidate-facing application page. Rendered outside the auth gate — no token,
 * no sidebar, mobile-first, because candidates arrive from a shared link
 * (usually on a phone) and are not users of the HR system.
 */
export const PublicApply = () => {
  const page = usePublicApplyPage();

  if (page.loading) {
    return (
      <PublicApplyShell>
        <LoadingState message={arabicSource("apply.loading")} variant="compact" />
      </PublicApplyShell>
    );
  }

  if (page.loadError || !page.info) {
    return (
      <PublicApplyShell>
        <PublicApplyNotice
          tone="error"
          title={arabicSource("apply.invalid_link_title")}
          body={arabicSource("apply.invalid_link_body")}
        />
      </PublicApplyShell>
    );
  }

  if (page.info.unusable_reason) {
    return (
      <PublicApplyShell>
        <PublicApplyNotice
          tone="error"
          title={arabicSource("apply.closed_title")}
          body={arabicSource("apply.closed_body")}
        />
      </PublicApplyShell>
    );
  }

  if (page.result) {
    return (
      <PublicApplyShell>
        <PublicApplySuccess
          result={page.result}
          onApplyAnother={page.resetForAnotherApplication}
        />
      </PublicApplyShell>
    );
  }

  return (
    <PublicApplyShell companyName={page.info.company_name}>
      <PublicApplyForm
        acceptFile={page.acceptFile}
        canSubmit={page.canSubmit}
        dragging={page.dragging}
        file={page.file}
        fileInputRef={page.fileInputRef}
        form={page.form}
        info={page.info}
        maxResumeMb={page.maxResumeMb}
        selectedJob={page.selectedJob}
        submitError={page.submitError}
        submitting={page.submitting}
        onDraggingChange={page.setDragging}
        onFileChange={page.setFile}
        onSubmit={page.handleSubmit}
        onUpdateForm={page.updateForm}
      />
    </PublicApplyShell>
  );
};
