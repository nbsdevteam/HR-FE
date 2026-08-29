import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import PublicLeaveStatusResultRow from "./PublicLeaveStatusResultRow";
import type { PublicLeaveStatusResult as PublicLeaveStatusResultType } from "../types/publicLeave";

type PublicLeaveStatusResultProps = {
  statuses: PublicLeaveStatusResultType[];
  onBack: () => void;
};

/** Every request filed by this employee — identified by name (+ verification), no reference code needed. */
const PublicLeaveStatusResult = ({ statuses, onBack }: PublicLeaveStatusResultProps) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    {statuses.length === 0 ? (
      <p className="text-muted-foreground text-center py-6" style={{ fontSize: 13 }}>
        {arabicSource("public_leave.status_empty")}
      </p>
    ) : (
      <div className="space-y-3">
        {statuses.map((status) => (
          <PublicLeaveStatusResultRow key={status.reference_code} status={status} />
        ))}
      </div>
    )}

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
