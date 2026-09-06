import { memo, useCallback, useRef, useState } from "react";
import type React from "react";
import { BookmarkCheck } from "lucide-react";
import { type DbApplicant } from "@/shared/hooks";
import StarRating from "./StarRating";

type PipelineCardProps = {
  applicant: DbApplicant;
  onSelect: (applicant: DbApplicant) => void;
  onDragStateChange: (applicantId: string | null) => void;
};

/** Pixels of pointer travel before a press is treated as a drag rather than a click. */
const DRAG_THRESHOLD = 5;

const PipelineCard = ({ applicant, onSelect, onDragStateChange }: PipelineCardProps) => {
  const [dragging, setDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    startPos.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      dragged.current = true;
    }
  }, []);

  const handleClick = useCallback((): void => {
    if (dragged.current) return;
    onSelect(applicant);
  }, [onSelect, applicant]);

  const handleCardDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      dragged.current = true;
      e.dataTransfer.setData("applicant-id", applicant.id);
      e.dataTransfer.effectAllowed = "move";
      setDragging(true);
      onDragStateChange(applicant.id);
    },
    [applicant, onDragStateChange],
  );

  const handleCardDragEnd = useCallback((): void => {
    setDragging(false);
    onDragStateChange(null);
  }, [onDragStateChange]);

  return (
    <div
      draggable
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onDragStart={handleCardDragStart}
      onDragEnd={handleCardDragEnd}
      className={`p-2.5 rounded-lg bg-muted/20 border border-border/20 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:scale-[1.02] transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-foreground" style={{ fontSize: 12 }}>
          {applicant.name}
        </p>
        {applicant.is_bookmarked && (
          <BookmarkCheck className="w-3 h-3 text-primary" />
        )}
      </div>
      <p className="text-muted-foreground" style={{ fontSize: 10 }}>
        {applicant.job_title || "—"}
      </p>
      <div className="mt-1.5">
        <StarRating value={applicant.rating} size={10} />
      </div>
    </div>
  );
};

export default memo(PipelineCard);
