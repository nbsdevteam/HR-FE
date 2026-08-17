import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type PoliciesHeaderProps = {
  onCreateClick: () => void;
};

const PoliciesHeader = ({ onCreateClick }: PoliciesHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-gradient-gold text-xl sm:text-2xl">{arabicSource("common.policies_and_procedures")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{arabicSource("common.internal_policies_and_systems_manual")}</p>
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onCreateClick}
      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer w-full sm:w-auto flex-shrink-0"
    >
      <Plus className="w-5 h-5" />
      {arabicSource("policies.add_policy")}
    </motion.button>
  </div>
);

export default PoliciesHeader;
