import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Copy, Printer } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveSuccessProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * The reference code is the only thing the employee walks away with, and
 * it's required to check status later — must be impossible to miss
 * (backend hand-off §6).
 */
const PublicLeaveSuccess = ({ page }: PublicLeaveSuccessProps) => {
  const [copied, setCopied] = useState(false);
  const result = page.form.result;

  const handleCopyClick = async (): Promise<void> => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reference_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the code is visible and selectable anyway */
    }
  };

  const handlePrintClick = (): void => {
    window.print();
  };

  const handleTrackClick = (): void => {
    page.handleGoToTrack();
  };

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center"
    >
      <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
      <h2 className="text-foreground mb-2" style={{ fontSize: 20 }}>{arabicSource("public_leave.success_title")}</h2>
      <p className="text-muted-foreground mb-1" style={{ fontSize: 14 }}>{arabicSource("public_leave.success_pending_notice")}</p>
      <p className="text-muted-foreground mb-5" style={{ fontSize: 13 }}>{arabicSource("public_leave.success_save_code_hint")}</p>

      <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/10 px-6 py-4">
        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("public_leave.reference_label")}</span>
        <span className="text-primary select-all" style={{ fontSize: 24, letterSpacing: 1 }} dir="ltr">
          {result.reference_code}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        <button
          type="button"
          onClick={handleCopyClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          style={{ fontSize: 13 }}
        >
          <Copy className="w-4 h-4" />
          {copied ? arabicSource("public_leave.copied") : arabicSource("public_leave.copy_reference")}
        </button>
        <button
          type="button"
          onClick={handlePrintClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          style={{ fontSize: 13 }}
        >
          <Printer className="w-4 h-4" />
          {arabicSource("public_leave.print_hint")}
        </button>
      </div>

      <button
        type="button"
        onClick={handleTrackClick}
        className="mt-6 text-primary hover:underline cursor-pointer"
        style={{ fontSize: 12.5 }}
      >
        {arabicSource("public_leave.track_link")}
      </button>
    </motion.div>
  );
};

export default PublicLeaveSuccess;
