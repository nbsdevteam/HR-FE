import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type PoliciesHeaderProps = {
  onCreateClick: () => void;
};

const PoliciesHeader = ({ onCreateClick }: PoliciesHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-gradient-gold text-xl sm:text-2xl">
        {arabicSource("common.policies_and_procedures")}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {arabicSource("common.internal_policies_and_systems_manual")}
      </p>
    </div>
    <motion.div whileHover={{ scale: 1.02 }} className="w-full sm:w-auto flex-shrink-0">
      <Button
        size="lg"
        icon={Plus}
        onClick={onCreateClick}
        className="w-full shadow-lg shadow-primary/20"
      >
        {arabicSource("policies.add_policy")}
      </Button>
    </motion.div>
  </div>
);

export default PoliciesHeader;
