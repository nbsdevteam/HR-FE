import { Check, Undo2 } from "lucide-react";
import { Button, Toast } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { PendingAssignmentUndo } from "../types";

type PositionAssignmentUndoToastProps = {
  entry: PendingAssignmentUndo;
  onUndo: () => void;
};

/**
 * The confirm step for a drop. Dragging commits the moment you let go, so the
 * only place to take it back is here — for as long as the toast is up.
 */
const PositionAssignmentUndoToast = ({ entry, onUndo }: PositionAssignmentUndoToastProps) => (
  <Toast
    position="bottom-center"
    toneClassName="bg-toast-success border-toast-success-border"
    textClassName="text-toast-success-fg font-medium"
    textSize={12}
    icon={Check}
    iconBoxClassName="bg-toast-success-border/25"
    iconClassName="w-3 h-3 text-toast-success-fg"
    message={
      <span className="flex items-center gap-3">
        <span>
          {arabicSource("common.is_set")}
          <span data-i18n-ignore>{entry.employeeName}</span>
          {arabicSource("hierarchy.in_position")}
          <span data-i18n-ignore>{entry.positionTitle}</span>
          {arabicSource("common.successfully")}
        </span>
        <Button
          variant="unstyled"
          size="unstyled"
          rounded="rounded-md"
          icon={Undo2}
          iconClassName="w-3.5 h-3.5"
          onClick={onUndo}
          className="px-2 py-1 gap-1.5 text-toast-success-fg underline underline-offset-2 hover:bg-toast-success-border/25"
          style={{ fontSize: 12 }}
        >
          {arabicSource("hierarchy.undo")}
        </Button>
      </span>
    }
  />
);

export default PositionAssignmentUndoToast;
