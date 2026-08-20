import { memo, useCallback } from "react";
import { CheckCircle, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbTrainingParticipant } from "@/shared/hooks";

type TProgramParticipantRowProps = {
  participant: DbTrainingParticipant;
  employeeName: string;
  statusColor: string;
  onMarkParticipantCompleted: (participantId: string, score: number) => void;
  onDeleteParticipant: (participantId: string) => void;
};

const ProgramParticipantRow = ({
  participant,
  employeeName,
  statusColor,
  onMarkParticipantCompleted,
  onDeleteParticipant,
}: TProgramParticipantRowProps) => {
  const handleMarkCompleted = useCallback(
    () => onMarkParticipantCompleted(participant.id, 85),
    [onMarkParticipantCompleted, participant.id],
  );
  const handleDelete = useCallback(
    () => onDeleteParticipant(participant.id),
    [onDeleteParticipant, participant.id],
  );

  return (
    <div className="flex items-center justify-between p-2 rounded bg-card/50 border border-border/20">
      <div className="flex-1">
        <p className="text-xs text-foreground">{employeeName}</p>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs mt-1 border ${statusColor}`}
        >
          {participant.completion_status}
        </span>
      </div>
      {participant.score && (
        <span className="text-xs text-primary font-semibold ms-2">
          {participant.score}%
        </span>
      )}
      {participant.completion_status !== arabicSource("common.complete") && (
        <button
          onClick={handleMarkCompleted}
          className="ml-2 p-1 hover:bg-emerald-500/20 rounded transition-colors"
          title={arabicSource("training.status_update")}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </button>
      )}
      <button
        onClick={handleDelete}
        className="p-1 hover:bg-red-500/20 rounded transition-colors"
      >
        <X className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
};

export default memo(ProgramParticipantRow);
