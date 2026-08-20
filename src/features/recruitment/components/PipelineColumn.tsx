import { memo } from "react";
import { motion } from "motion/react";
import StatusBadge from "@/shared/components/StatusBadge";
import { arabicSource } from "@/i18n/source";
import { type DbApplicant } from "@/shared/hooks";
import { stageColors } from "../constants/recruitment";
import PipelineCard from "./PipelineCard";

type PipelineColumnProps = {
  stage: string;
  index: number;
  applicants: DbApplicant[];
  onSelectApplicant: (applicant: DbApplicant) => void;
};

const PipelineColumn = ({ stage, index, applicants, onSelectApplicant }: PipelineColumnProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl shadow-lg"
  >
    <div className="p-3 border-b border-border/20">
      <div className="flex items-center justify-between">
        <StatusBadge colorClassName={stageColors[stage]}>{stage}</StatusBadge>
        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{applicants.length}</span>
      </div>
    </div>
    <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
      {applicants.length > 0 ? applicants.map((applicant) => (
        <PipelineCard key={applicant.id} applicant={applicant} onSelect={onSelectApplicant} />
      )) : (
        <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>{arabicSource("recruitment.none")}</p>
      )}
    </div>
  </motion.div>
);

export default memo(PipelineColumn);
