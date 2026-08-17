import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ApplySubmitResult } from "@/features/recruitment/api/publicApi";

type PublicApplySuccessProps = {
  result: ApplySubmitResult;
  onApplyAnother: () => void;
};

const PublicApplySuccess = ({ result, onApplyAnother }: PublicApplySuccessProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center"
  >
    <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
    <h2 className="text-foreground mb-2" style={{ fontSize: 20 }}>
      {arabicSource("apply.success_title")}
    </h2>
    <p className="text-muted-foreground mb-5" style={{ fontSize: 14 }}>
      {result.resubmitted
        ? arabicSource("apply.resubmitted_body")
        : arabicSource("apply.success_body")}
    </p>
    <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/10 px-6 py-4">
      <span className="text-muted-foreground" style={{ fontSize: 11 }}>
        {arabicSource("apply.reference")}
      </span>
      <span className="text-primary" style={{ fontSize: 20, letterSpacing: 1 }} dir="ltr">
        {result.reference_code}
      </span>
    </div>
    <div>
      <button
        onClick={onApplyAnother}
        className="mt-6 px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
        style={{ fontSize: 13 }}
      >
        {arabicSource("apply.apply_another")}
      </button>
    </div>
  </motion.div>
);

export default PublicApplySuccess;
