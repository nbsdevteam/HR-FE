import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components";
import type { ExitClearanceSection, ExitSectionState } from "@/shared/hooks";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import { EXIT_SECTION_STATE_KEYS } from "../utils/exitStages";
import ExitRejectDialog from "./ExitRejectDialog";
import ExitSignatureRow from "./ExitSignatureRow";
import ExitSignDialog from "./ExitSignDialog";

type ExitClearanceSectionPanelProps = {
  section: ExitClearanceSection;
  actions: ExitClearanceActions;
};

/** Which decision the open dialog is collecting, and for which record. */
type DialogTarget = { kind: "sign" | "reject_signature" | "reject_section"; id: string };

const STATE_TONE: Record<ExitSectionState, string> = {
  pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  signing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-muted/30 text-muted-foreground border-border/40",
};

/**
 * The approval and ordered signatures that gate one clearance category. Which
 * buttons show is the backend's verdict for the signed-in user (`can_approve`,
 * `can_sign`, `can_resend`); ordering and permissions are enforced there too.
 */
const ExitClearanceSectionPanel = ({ section, actions }: ExitClearanceSectionPanelProps) => {
  const [dialog, setDialog] = useState<DialogTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = useCallback(async (): Promise<void> => {
    setSubmitting(true);
    await actions.approve(section.id);
    setSubmitting(false);
  }, [actions, section.id]);

  const handleResend = useCallback(async (signatureId: string): Promise<void> => {
    setSubmitting(true);
    await actions.resend(signatureId);
    setSubmitting(false);
  }, [actions]);

  const handleSectionRejectOpen = useCallback((): void => {
    setDialog({ kind: "reject_section", id: section.id });
  }, [section.id]);
  const handleSignOpen = useCallback((signatureId: string): void => {
    setDialog({ kind: "sign", id: signatureId });
  }, []);
  const handleDeclineOpen = useCallback((signatureId: string): void => {
    setDialog({ kind: "reject_signature", id: signatureId });
  }, []);
  const handleDialogClose = useCallback((): void => setDialog(null), []);

  const handleSignSubmit = useCallback(async (typedName: string, notes: string): Promise<void> => {
    if (dialog?.kind !== "sign") return;
    setSubmitting(true);
    if (await actions.sign(dialog.id, typedName, notes)) setDialog(null);
    setSubmitting(false);
  }, [actions, dialog]);

  const handleRejectSubmit = useCallback(async (reason: string): Promise<void> => {
    if (!dialog || dialog.kind === "sign") return;
    setSubmitting(true);
    const done = dialog.kind === "reject_section"
      ? await actions.rejectSection(dialog.id, reason)
      : await actions.rejectSignature(dialog.id, reason);
    if (done) setDialog(null);
    setSubmitting(false);
  }, [actions, dialog]);

  const awaitingApproval = section.state === "pending_approval";
  const noApprovers = awaitingApproval && section.approver_count === 0;

  return (
    <div className="rounded-lg border border-border/40 bg-muted/5 p-3 mb-2 space-y-2" data-exit-section={section.state}>
      <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 13 }}>
        <span className="text-foreground">{arabicSource("lifecycle.exit_clr_approval")}</span>
        {section.approved_at ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {arabicSource("lifecycle.exit_clr_approved_by")} <span dir="auto">{section.approved_by_name}</span>
            {" · "}<span dir="ltr">{formatDateTime(section.approved_at)}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{arabicSource("lifecycle.exit_clr_not_approved")}</span>
        )}
        <span className={`ms-auto px-2.5 py-0.5 rounded-md border ${STATE_TONE[section.state] ?? ""}`} style={{ fontSize: 11 }}>
          {EXIT_SECTION_STATE_KEYS[section.state] ? arabicSource(EXIT_SECTION_STATE_KEYS[section.state]) : section.state}
        </span>
      </div>

      {noApprovers && (
        <p className="flex items-center gap-1.5 text-amber-400" style={{ fontSize: 12 }} data-exit-no-approvers>
          <AlertTriangle className="w-3.5 h-3.5" />
          {arabicSource("lifecycle.exit_clr_no_approvers")}
        </p>
      )}

      {section.can_approve && awaitingApproval && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="success" disabled={submitting} onClick={handleApprove}>
            {arabicSource("lifecycle.exit_clr_approve")}
          </Button>
          <Button size="sm" variant="destructive" disabled={submitting} onClick={handleSectionRejectOpen}>
            {arabicSource("lifecycle.exit_clr_reject")}
          </Button>
        </div>
      )}

      {section.signatures.length > 0 && (
        <div>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("lifecycle.exit_clr_signatures")}</p>
          {section.signatures.map(signature => (
            <ExitSignatureRow
              key={signature.id}
              signature={signature}
              busy={submitting}
              onSign={handleSignOpen}
              onDecline={handleDeclineOpen}
              onResend={handleResend}
            />
          ))}
        </div>
      )}

      {dialog?.kind === "sign" && (
        <ExitSignDialog submitting={submitting} onClose={handleDialogClose} onSubmit={handleSignSubmit} />
      )}
      {dialog && dialog.kind !== "sign" && (
        <ExitRejectDialog submitting={submitting} onClose={handleDialogClose} onSubmit={handleRejectSubmit} />
      )}
    </div>
  );
};

export default ExitClearanceSectionPanel;
