import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Loader2, Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type ExpandFormCardProps = {
  cardClassName: string;
  title: ReactNode;
  saveLabel: ReactNode;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
};

const ExpandFormCard = ({ cardClassName, title, saveLabel, saving, onSave, onCancel, children }: ExpandFormCardProps) => (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${cardClassName} p-5`}>
    <h3 className="text-foreground mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {children}
    </div>
    <div className="flex gap-2 mt-4">
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs cursor-pointer disabled:opacity-50">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {saveLabel}
      </button>
      <button onClick={onCancel} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-xs cursor-pointer">{arabicSource("common.cancel")}</button>
    </div>
  </motion.div>
);

export default ExpandFormCard;
