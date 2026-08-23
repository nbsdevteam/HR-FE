import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

const DEFAULT_GRID_CLASS = "grid grid-cols-1 md:grid-cols-3 gap-4";

type ExpandFormCardProps = {
  cardClassName: string;
  title: ReactNode;
  saveLabel: ReactNode;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  /** Full replacement for the field grid's className (not merged). */
  gridClassName?: string;
  children: ReactNode;
};

const ExpandFormCard = ({
  cardClassName,
  title,
  saveLabel,
  saving,
  onSave,
  onCancel,
  gridClassName,
  children,
}: ExpandFormCardProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className={`${cardClassName} p-5`}
  >
    <h3 className="text-foreground mb-4">{title}</h3>
    <div className={gridClassName ?? DEFAULT_GRID_CLASS}>{children}</div>
    <div className="flex gap-2 mt-4">
      <Button size="sm" icon={Save} loading={saving} onClick={onSave}>
        {saveLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={onCancel}>
        {arabicSource("common.cancel")}
      </Button>
    </div>
  </motion.div>
);

export default ExpandFormCard;
