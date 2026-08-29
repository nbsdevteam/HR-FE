import { motion } from "motion/react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import { PUBLIC_LEAVE_VERIFY_PROMPTS } from "../constants/publicLeaveVerification";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveVerifyFormProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

const PublicLeaveVerifyForm = ({ page }: PublicLeaveVerifyFormProps) => {
  const { handleBackFromVerify, handleConfirmVerification, info, search, verification } = page;
  const employee = search.selected;
  const { primary } = useLocalizedName(employee?.name_ar || "", employee?.name || "");

  const method = info.info?.verification_method || "none";
  const prompt = PUBLIC_LEAVE_VERIFY_PROMPTS[method];

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    verification.setValue(event.target.value);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    handleConfirmVerification();
  };

  if (!employee || !prompt) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-foreground" style={{ fontSize: 18 }}>{arabicSource("public_leave.verify_title")}</h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }} data-i18n-ignore>{primary}</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
            {arabicSource(prompt.labelKey)}
          </label>
          <input
            type={prompt.inputType}
            dir="ltr"
            value={verification.value}
            onChange={handleValueChange}
            maxLength={method === "phone_last4" ? 4 : undefined}
            className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
            style={{ fontSize: 14 }}
            autoFocus
          />
        </div>

        {verification.error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span style={{ fontSize: 12.5 }}>{verification.error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBackFromVerify}
            className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
            style={{ fontSize: 13 }}
          >
            {arabicSource("common.previous")}
          </button>
          <button
            type="submit"
            disabled={verification.verifying || !verification.value.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            style={{ fontSize: 13 }}
          >
            {verification.verifying ? arabicSource("public_leave.verifying") : arabicSource("public_leave.verify_confirm")}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PublicLeaveVerifyForm;
