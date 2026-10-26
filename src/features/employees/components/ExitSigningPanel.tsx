import { useCallback, useState } from "react";
import { PenLine } from "lucide-react";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { EXIT_SIGNING_LINK_STATE_KEYS } from "../utils/exitStages";
import ExitSigningLinkActions from "./ExitSigningLinkActions";

type ExitSigningPanelProps = {
  proc: DbExitProcess;
  /** `hr.lifecycle.edit`. */
  canIssue: boolean;
  actions: ExitDecisionActions;
  cardCls: string;
};

const when = (value: string | null): string => (value ? formatDateTime(value, { timeZone: "Asia/Baghdad" }) : "—");

/** The leaving employee's signing link: its state and history, and — for HR only — the link itself. */
const ExitSigningPanel = ({ proc, canIssue, actions, cardCls }: ExitSigningPanelProps) => {
  const [busy, setBusy] = useState(false);
  const { signature } = proc;

  const handleIssue = useCallback(async (): Promise<void> => {
    setBusy(true);
    await actions.issueLink(proc.id);
    setBusy(false);
  }, [actions, proc.id]);

  if (!signature) return null;

  return (
    <section className={`${cardCls} p-5 space-y-3`} data-exit-signing={signature.state}>
      <h3 className="flex items-center gap-2 text-foreground">
        <PenLine className="w-5 h-5 text-primary" />
        {arabicSource("lifecycle.exit_signing_title")}
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource(EXIT_SIGNING_LINK_STATE_KEYS[signature.state] ?? "lifecycle.exit_clr_sig_sent")}
        </span>
      </h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-2" style={{ fontSize: 12 }}>
        <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_emailed_to")}</dt>
        <dd className="text-foreground md:col-span-2" dir="ltr">{signature.emailed_to || "—"}</dd>
        <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_expires")}</dt>
        <dd className="text-foreground md:col-span-2" dir="ltr">{when(signature.expires_at)}</dd>
        <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_first_viewed")}</dt>
        <dd className="text-foreground md:col-span-2" dir="ltr">{when(signature.first_viewed_at)} ({signature.view_count})</dd>
        {signature.decided_at && (
          <>
            <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_decided_at")}</dt>
            <dd className="text-foreground md:col-span-2" dir="ltr">{when(signature.decided_at)}</dd>
          </>
        )}
        {signature.typed_name && (
          <>
            <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_signed_by")}</dt>
            <dd className="text-foreground md:col-span-2" dir="auto">{signature.typed_name}</dd>
          </>
        )}
        {signature.decision_notes && (
          <>
            <dt className="text-muted-foreground">{arabicSource("lifecycle.exit_signing_notes")}</dt>
            <dd className="text-foreground md:col-span-2" dir="auto">{signature.decision_notes}</dd>
          </>
        )}
      </dl>
      {(signature.path || canIssue) && (
        <ExitSigningLinkActions signature={signature} canIssue={canIssue} busy={busy} onIssue={handleIssue} />
      )}
    </section>
  );
};

export default ExitSigningPanel;
