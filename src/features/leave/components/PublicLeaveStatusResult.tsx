import { motion } from "motion/react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { PublicLeaveStatusResult as PublicLeaveStatusResultType } from "../types/publicLeave";

type PublicLeaveStatusResultProps = {
  status: PublicLeaveStatusResultType;
  onBack: () => void;
};

/** Deliberately coarse — no approver names, no internal notes (backend hand-off §7). */
const STATE_LABEL_KEYS: Record<PublicLeaveStatusResultType["state"], ArabicSourceKey> = {
  submitted: "public_leave.status_submitted",
  pending: "public_leave.status_pending",
  approved: "public_leave.status_approved",
  rejected: "public_leave.status_rejected",
  cancelled: "public_leave.status_cancelled",
};

const STATE_TONE: Record<PublicLeaveStatusResultType["state"], string> = {
  submitted: "text-primary bg-primary/10 border-primary/30",
  pending: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-destructive bg-destructive/10 border-destructive/30",
  cancelled: "text-muted-foreground bg-muted/10 border-border",
};

const PublicLeaveStatusResult = ({ status, onBack }: PublicLeaveStatusResultProps) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    <div className="text-center">
      <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("public_leave.reference_label")}</span>
      <div className="text-foreground" style={{ fontSize: 18, letterSpacing: 1 }} dir="ltr">{status.reference_code}</div>
    </div>

    <div className={`inline-flex w-full items-center justify-center px-4 py-2 rounded-lg border ${STATE_TONE[status.state]}`} style={{ fontSize: 13 }}>
      {arabicSource(STATE_LABEL_KEYS[status.state])}
    </div>

    <div className="rounded-xl border border-border divide-y divide-border">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.leave_type_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>{status.leave_type_name}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.date_from_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{status.date_from} — {status.date_to}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.number_of_days_label")}</span>
        <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{status.number_of_days}</span>
      </div>
    </div>

    <button
      type="button"
      onClick={onBack}
      className="w-full px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
      style={{ fontSize: 13 }}
    >
      {arabicSource("common.previous")}
    </button>
  </motion.div>
);

export default PublicLeaveStatusResult;
