import { AnimatePresence } from "motion/react";
import type { DbTrainingParticipant, DbTrainingProgram } from "@/shared/hooks";
import { getProgramParticipants } from "../utils/trainingDisplay";
import TrainingProgramCard from "./TrainingProgramCard";

type TrainingProgramsGridProps = {
  programs: DbTrainingProgram[];
  participants: DbTrainingParticipant[];
  trainingCategories: string[];
  statusColors: Record<string, string>;
  statusIcons: Record<string, any>;
  participantStatusColors: Record<string, string>;
  getEmployeeName: (employeeId: string) => string;
  onEditProgram: (program: DbTrainingProgram) => void;
  onDeleteProgram: (programId: string) => void;
  onEnrollProgram: (programId: string) => void;
  onMarkParticipantCompleted: (participantId: string, score: number) => void;
  onDeleteParticipant: (participantId: string) => void;
};

const TrainingProgramsGrid = ({
  programs,
  participants,
  trainingCategories,
  statusColors,
  statusIcons,
  participantStatusColors,
  getEmployeeName,
  onEditProgram,
  onDeleteProgram,
  onEnrollProgram,
  onMarkParticipantCompleted,
  onDeleteParticipant,
}: TrainingProgramsGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <AnimatePresence>
      {programs.map((program, i) => (
        <TrainingProgramCard
          key={program.id}
          program={program}
          index={i}
          participants={getProgramParticipants(participants, program.id)}
          trainingCategories={trainingCategories}
          statusColors={statusColors}
          statusIcons={statusIcons}
          participantStatusColors={participantStatusColors}
          getEmployeeName={getEmployeeName}
          onEdit={() => onEditProgram(program)}
          onDelete={() => onDeleteProgram(program.id)}
          onEnroll={() => onEnrollProgram(program.id)}
          onMarkParticipantCompleted={onMarkParticipantCompleted}
          onDeleteParticipant={onDeleteParticipant}
        />
      ))}
    </AnimatePresence>
  </div>
);

export default TrainingProgramsGrid;
