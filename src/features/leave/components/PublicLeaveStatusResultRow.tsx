import { memo } from "react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { PublicLeaveStatusResult } from "../types/publicLeave";

type PublicLeaveStatusResultRowProps = {
  status: PublicLeaveStatusResult;
};

/** Deliberately coarse — no approver names, no internal notes (backend hand-off §7). */
const STATE_LABEL_KEYS: Record<PublicLeaveStatusResult["state"], ArabicSourceKey> = {
  submitted: "public_leave.status_submitted",
  pending: "public_leave.status_pending",
  approved: "public_leave.status_approved",
  rejected: "public_leave.status_rejected",
  cancelled: "public_leave.status_cancelled",
};

const STATE_TONE: Record<PublicLeaveStatusResult["state"], string> = {
  submitted: "text-primary bg-primary/10 border-primary/30",
  pending: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-destructive bg-destructive/10 border-destructive/30",
  cancelled: "text-muted-foreground bg-muted/10 border-border",
};

const PublicLeaveStatusResultRow = ({ status }: PublicLeaveStatusResultRowProps) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10">
      <span style={{ fontSize: 12.5, letterSpacing: 0.5 }} dir="ltr">{status.reference_code}</span>
      <span className={`px-2.5 py-1 rounded-full border ${STATE_TONE[status.state]}`} style={{ fontSize: 11.5 }}>
        {arabicSource(STATE_LABEL_KEYS[status.state])}
      </span>
    </div>
    <div className="divide-y divide-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.leave_type_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>{status.leave_type_name}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.date_from_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{status.date_from} — {status.date_to}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.number_of_days_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{status.number_of_days}</span>
      </div>
    </div>
  </div>
);

export default memo(PublicLeaveStatusResultRow);
