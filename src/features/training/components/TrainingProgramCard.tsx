import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Clock, Edit2, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { DbTrainingParticipant, DbTrainingProgram } from "@/shared/hooks";
import { statusColorPalette } from "../constants/training";
import ProgramObjectiveItem from "./ProgramObjectiveItem";
import ProgramParticipantRow from "./ProgramParticipantRow";

interface ITrainingProgramCardProps {
  program: DbTrainingProgram;
  index: number;
  participants: DbTrainingParticipant[];
  trainingCategories: string[];
  statusColors: Record<string, string>;
  statusIcons: Record<string, LucideIcon>;
  participantStatusColors: Record<string, string>;
  getEmployeeName: (employeeId: string) => string;
  onEditProgram: (program: DbTrainingProgram) => void;
  onDeleteProgram: (programId: string) => void;
  onEnrollProgram: (programId: string) => void;
  onMarkParticipantCompleted: (participantId: string, score: number) => void;
  onDeleteParticipant: (participantId: string) => void;
}

const TrainingProgramCard = ({
  program,
  index,
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
}: ITrainingProgramCardProps) => {
  const StatusIcon = statusIcons[program.status];

  const handleEdit = useCallback(
    () => onEditProgram(program),
    [onEditProgram, program],
  );
  const handleDelete = useCallback(
    () => onDeleteProgram(program.id),
    [onDeleteProgram, program.id],
  );
  const handleEnroll = useCallback(
    () => onEnrollProgram(program.id),
    [onEnrollProgram, program.id],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -3 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-foreground">{program.title}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {program.instructor || arabicSource("training.without_a_coach")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="unstyled"
            size="icon"
            rounded="rounded-lg"
            icon={Edit2}
            iconClassName="w-4 h-4 text-primary"
            onClick={handleEdit}
            className="hover:bg-primary/20"
          />
          <Button
            variant="unstyled"
            size="icon"
            rounded="rounded-lg"
            icon={Trash2}
            iconClassName="w-4 h-4 text-red-400"
            onClick={handleDelete}
            className="hover:bg-red-500/20"
          />
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${statusColors[program.status]}`}
        style={{ fontSize: 12 }}
      >
        {StatusIcon && <StatusIcon className="w-3 h-3" />}
        {program.status}
      </span>

      <div className="flex flex-wrap gap-3 my-3">
        <span
          className={`px-2 py-0.5 rounded-md border ${
            statusColorPalette[
              trainingCategories.indexOf(program.category) %
                statusColorPalette.length
            ] || "bg-primary/10 border-primary/20 text-primary"
          }`}
          style={{ fontSize: 11 }}
        >
          {program.category} ({program.weight})
        </span>
        {program.duration && (
          <span
            className="text-muted-foreground flex items-center gap-1"
            style={{ fontSize: 12 }}
          >
            <Clock className="w-3 h-3" /> {program.duration}
          </span>
        )}
        <span
          className="text-muted-foreground flex items-center gap-1"
          style={{ fontSize: 12 }}
        >
          <Users className="w-3 h-3" /> {participants.length}{" "}
          {arabicSource("training.participant")}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource("common.completion_rate")}
          </span>
          <span className="text-foreground" style={{ fontSize: 11 }}>
            {program.completion_rate}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${program.completion_rate}%` }}
            transition={{ duration: 1, delay: index * 0.1 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      {program.objectives && program.objectives.length > 0 && (
        <div className="space-y-1 mb-3">
          {program.objectives.slice(0, 2).map((obj, oi) => (
            <ProgramObjectiveItem key={oi} objective={obj} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm text-foreground">
            {arabicSource("training.participants")}
          </h4>
          <Button
            variant="unstyled"
            size="unstyled"
            rounded="rounded"
            icon={Plus}
            iconClassName="w-3 h-3"
            onClick={handleEnroll}
            className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary hover:bg-primary/30 text-xs"
          >
            {arabicSource("common.addition")}
          </Button>
        </div>

        {participants.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participants.map((p) => (
              <ProgramParticipantRow
                key={p.id}
                participant={p}
                employeeName={getEmployeeName(p.employee_id)}
                statusColor={participantStatusColors[p.completion_status]}
                onMarkParticipantCompleted={onMarkParticipantCompleted}
                onDeleteParticipant={onDeleteParticipant}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {arabicSource("training.there_are_no_participants")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default memo(TrainingProgramCard);
