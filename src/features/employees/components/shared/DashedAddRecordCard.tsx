import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const dashedRecordInputClass =
  "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

type DashedAddRecordCardProps = {
  title: ReactNode;
  confirmDisabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
};

const DashedAddRecordCard = ({ title, confirmDisabled, onConfirm, onCancel, children }: DashedAddRecordCardProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="overflow-hidden"
  >
    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
      <p className="text-primary" style={{ fontSize: 13 }}>{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: 12 }}
        >
          <Check className="w-3.5 h-3.5" />
          {arabicSource("common.confirm")}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          {arabicSource("common.cancel")}
        </button>
      </div>
    </div>
  </motion.div>
);

export default DashedAddRecordCard;
