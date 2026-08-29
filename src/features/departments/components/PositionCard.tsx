import { memo, useCallback, useState } from "react";
import type React from "react";
import { motion } from "motion/react";
import { Briefcase, Edit2, Plus, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { PositionFillState, PositionNode, PositionRow } from "../types";
import PositionCardEmployeeRow from "./PositionCardEmployeeRow";

/** Per-card entrance stagger, capped so a big department doesn't crawl in. */
const MAX_STAGGER_DELAY = 0.3;
const STAGGER_STEP = 0.03;

const STATE_CLASSES: Record<PositionFillState, string> = {
  vacant: "border-dashed border-primary/30 bg-card/50 hover:border-primary/50",
  partial: "border-border/60 bg-card/50 hover:border-primary/40",
  full: "border-border/40 bg-card/30 hover:border-border",
  over: "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60",
};

type PositionCardProps = {
  row: PositionRow;
  color: string;
  departmentName: string;
  /** Position within its department grid — drives the entrance stagger only. */
  index: number;
  /** True from the moment an employee card is picked up until the drag ends. */
  isDragActive: boolean;
  onDrop: (employeeId: string, positionId: string) => void;
  onAddPosition: (parentId: string | null) => void;
  onDeletePosition: (posId: string) => void;
  onEditPosition: (pos: PositionNode) => void;
};

/**
 * One position, one card, and the drop target for an assignment. While a drag
 * is in flight the card states its answer up front: it lights up if it has
 * room, or dims and refuses the drop outright if it doesn't.
 */
const PositionCard = ({
  row,
  color,
  departmentName,
  index,
  isDragActive,
  onDrop,
  onAddPosition,
  onDeletePosition,
  onEditPosition,
}: PositionCardProps) => {
  const [dragOver, setDragOver] = useState(false);

  const { node, fillState, canAccept } = row;
  const assigned = node.assignedEmployees.length;
  const vacancies = node.max_headcount - assigned;

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!canAccept) {
        // No preventDefault: the card is not a valid drop target, so the browser
        // shows the no-drop cursor and never fires `drop` here.
        e.dataTransfer.dropEffect = "none";
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOver(true);
    },
    [canAccept],
  );

  const handleDragLeave = useCallback((): void => setDragOver(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(false);
      if (!canAccept) return;
      const employeeId = e.dataTransfer.getData("employee-id");
      if (employeeId) onDrop(employeeId, node.id);
    },
    [canAccept, node.id, onDrop],
  );

  const handleEditPositionClick = useCallback((): void => {
    onEditPosition(node);
  }, [node, onEditPosition]);

  const handleAddPositionClick = useCallback((): void => {
    onAddPosition(node.id);
  }, [node.id, onAddPosition]);

  const handleDeletePositionClick = useCallback((): void => {
    onDeletePosition(node.id);
  }, [node.id, onDeletePosition]);

  // Tied to the live drag so a highlight can't survive a drag that ended elsewhere.
  const isDropTarget = dragOver && isDragActive;

  const dragClasses = !isDragActive
    ? STATE_CLASSES[fillState]
    : canAccept
      ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
      : "opacity-40 cursor-not-allowed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * STAGGER_STEP, MAX_STAGGER_DELAY) }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title={
        isDragActive && !canAccept
          ? arabicSource("hierarchy.position_is_full_cannot_drop")
          : undefined
      }
      className={`rounded-xl border-2 shadow-sm transition-all overflow-hidden flex flex-col ${
        isDropTarget
          ? "border-primary bg-primary/10 shadow-primary/30 shadow-lg scale-[1.02]"
          : dragClasses
      }`}
    >
      <div className="h-1.5 shrink-0" style={{ background: color }} />
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <Briefcase className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate" style={{ fontSize: 13 }}>
                {isDropTarget ? (
                  arabicSource("common.drop_here_to_set")
                ) : (
                  <span data-i18n-ignore>{node.title_ar}</span>
                )}
              </p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 10 }} data-i18n-ignore>
                {departmentName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleEditPositionClick}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-blue-500/20 transition-colors"
              title={arabicSource("common.edit")}
            >
              <Edit2 className="w-3 h-3 text-blue-400" />
            </button>
            <button
              onClick={handleAddPositionClick}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/20 transition-colors"
              title={arabicSource("hierarchy.add_a_sub_position")}
            >
              <Plus className="w-3 h-3 text-primary" />
            </button>
            {assigned === 0 && node.children.length === 0 && (
              <button
                onClick={handleDeletePositionClick}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors"
                title={arabicSource("common.delete")}
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Who already holds it — kept on the card, never behind a toggle. */}
        {assigned > 0 && (
          <div className="space-y-1.5">
            {node.assignedEmployees.map((employee) => (
              <PositionCardEmployeeRow key={employee.id} employee={employee} color={color} />
            ))}
          </div>
        )}

        {vacancies > 0 && (
          <div
            className={`p-2 rounded-lg border-2 border-dashed text-center transition-colors ${
              isDropTarget ? "border-primary/60 bg-primary/5" : "border-border/30"
            }`}
          >
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              {isDropTarget
                ? arabicSource("common.drop_here_to_set")
                : `${vacancies} ${arabicSource("common.vacant")}`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span
            className="text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/40"
            style={{ fontSize: 10 }}
          >
            {assigned}/{node.max_headcount}
          </span>
          {(fillState === "full" || fillState === "over") && (
            <span
              className={fillState === "over" ? "text-amber-500" : "text-muted-foreground"}
              style={{ fontSize: 10 }}
            >
              {fillState === "over"
                ? arabicSource("hierarchy.filter_over_capacity")
                : arabicSource("hierarchy.status_full")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(PositionCard);
