import { memo, useCallback, useState } from "react";
import type React from "react";
import { motion } from "motion/react";
import StatusBadge from "@/shared/components/StatusBadge";
import { arabicSource } from "@/i18n/source";
import { type DbApplicant } from "@/shared/hooks";
import { stageColors } from "../constants/recruitment";
import PipelineCard from "./PipelineCard";

interface IPipelineColumnProps {
  stage: string;
  index: number;
  applicants: DbApplicant[];
  isDragActive: boolean;
  onSelectApplicant: (applicant: DbApplicant) => void;
  onDragStateChange: (applicantId: string | null) => void;
  onDropApplicant: (applicantId: string, stage: string) => void;
}

const PipelineColumn = ({
  stage,
  index,
  applicants,
  isDragActive,
  onSelectApplicant,
  onDragStateChange,
  onDropApplicant,
}: IPipelineColumnProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((): void => setDragOver(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(false);
      const applicantId = e.dataTransfer.getData("applicant-id");
      if (!applicantId) return;
      if (applicants.some((applicant) => applicant.id === applicantId)) return;
      onDropApplicant(applicantId, stage);
    },
    [applicants, onDropApplicant, stage],
  );

  const isDropTarget = dragOver && isDragActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-card/30 backdrop-blur-md border rounded-xl shadow-lg transition-all ${
        isDropTarget
          ? "border-primary bg-primary/5 shadow-primary/20 scale-[1.01]"
          : isDragActive
            ? "border-primary/30"
            : "border-border/40"
      }`}
    >
      <div className="p-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <StatusBadge colorClassName={stageColors[stage]}>{stage}</StatusBadge>
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {applicants.length}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {applicants.length > 0 ? (
          applicants?.map((applicant) => (
            <PipelineCard
              key={applicant.id}
              applicant={applicant}
              onSelect={onSelectApplicant}
              onDragStateChange={onDragStateChange}
            />
          ))
        ) : (
          <p
            className={`text-muted-foreground text-center py-4 rounded-lg transition-colors ${
              isDropTarget ? "border-2 border-dashed border-primary/50" : ""
            }`}
            style={{ fontSize: 12 }}
          >
            {isDropTarget
              ? arabicSource("common.drop_here_to_set")
              : arabicSource("recruitment.none")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default memo(PipelineColumn);
