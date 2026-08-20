import { useMemo } from "react";
import { AnimatePresence } from "motion/react";
import type { DbTrainingParticipant, DbTrainingProgram } from "@/shared/hooks";
import TrainingProgramCard from "./TrainingProgramCard";

interface ITrainingProgramsGridProps {
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
}

const EMPTY_PARTICIPANTS: DbTrainingParticipant[] = [];

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
}: ITrainingProgramsGridProps) => {
  const participantsByProgram = useMemo(() => {
    const map = new Map<string, DbTrainingParticipant[]>();
    participants.forEach((p) => {
      const list = map.get(p.training_program_id);
      if (list) list.push(p);
      else map.set(p.training_program_id, [p]);
    });
    return map;
  }, [participants]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {programs.map((program, i) => (
          <TrainingProgramCard
            key={program.id}
            program={program}
            index={i}
            participants={
              participantsByProgram.get(program.id) || EMPTY_PARTICIPANTS
            }
            trainingCategories={trainingCategories}
            statusColors={statusColors}
            statusIcons={statusIcons}
            participantStatusColors={participantStatusColors}
            getEmployeeName={getEmployeeName}
            onEditProgram={onEditProgram}
            onDeleteProgram={onDeleteProgram}
            onEnrollProgram={onEnrollProgram}
            onMarkParticipantCompleted={onMarkParticipantCompleted}
            onDeleteParticipant={onDeleteParticipant}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TrainingProgramsGrid;
