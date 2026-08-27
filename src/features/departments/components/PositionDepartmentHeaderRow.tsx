import { memo, useRef, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { PositionDepartmentGroup } from "../types";

/** Hover-to-open delay while dragging — long enough not to fire on a pass-through. */
const DRAG_EXPAND_DELAY_MS = 500;

type PositionDepartmentHeaderRowProps = {
  group: PositionDepartmentGroup;
  collapsed: boolean;
  isDragActive: boolean;
  onToggle: (departmentId: string) => void;
  onExpand: (departmentId: string) => void;
};

/**
 * Collapsible department heading. Hovering it mid-drag opens it after a beat,
 * which is what lets a collapsed group and an in-flight drag coexist.
 */
const PositionDepartmentHeaderRow = ({
  group,
  collapsed,
  isDragActive,
  onToggle,
  onExpand,
}: PositionDepartmentHeaderRowProps) => {
  const timerRef = useRef<number | null>(null);

  const clearExpandTimer = useCallback((): void => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleToggleClick = useCallback((): void => {
    onToggle(group.id);
  }, [group.id, onToggle]);

  const handleDragOver = useCallback((): void => {
    // `dragover` fires without preventDefault, so the heading can watch the drag
    // pass over it while staying a non-droppable target.
    if (!isDragActive || !collapsed || timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onExpand(group.id);
    }, DRAG_EXPAND_DELAY_MS);
  }, [isDragActive, collapsed, group.id, onExpand]);

  useEffect(() => clearExpandTimer, [clearExpandTimer]);

  return (
    <button
      type="button"
      onClick={handleToggleClick}
      onDragOver={handleDragOver}
      onDragLeave={clearExpandTimer}
      className="w-full h-full flex items-center gap-2 px-2 rounded-lg bg-card/40 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer text-start"
    >
      <ChevronDown
        className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform"
        style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
      />
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />
      <span className="text-foreground truncate flex-1 min-w-0" style={{ fontSize: 13 }}>
        {group.name}
      </span>
      <span
        className="shrink-0 px-1.5 py-0.5 rounded-md bg-muted/40 text-muted-foreground"
        style={{ fontSize: 10 }}
      >
        {group.rows.length}
      </span>
      {group.vacancies > 0 && (
        <span className="shrink-0 text-primary" style={{ fontSize: 10 }}>
          {group.vacancies} {arabicSource("common.vacant")}
        </span>
      )}
    </button>
  );
};

export default memo(PositionDepartmentHeaderRow);
