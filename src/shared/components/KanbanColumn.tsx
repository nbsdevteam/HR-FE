import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "./EmptyState";

interface KanbanColumnProps<T> {
  label: ReactNode;
  /** Defaults to items.length. */
  count?: number;
  index: number;
  /** Stagger delay multiplier applied to `index`. */
  delayStep?: number;
  accentClassName?: string;
  dotClassName?: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyIcon?: LucideIcon;
  emptyMessage: string;
  headerClassName?: string;
  labelFontSize?: number;
  bodyClassName?: string;
}

const DEFAULT_HEADER_CLASS = "p-4 border-b border-border/20 flex items-center justify-between";
const DEFAULT_BODY_CLASS = "p-3 space-y-3 min-h-[200px]";

/**
 * Shared Kanban column, factored out of the near-identical versions
 * employees, evaluation, leave, and warnings each built independently.
 */
const KanbanColumn = <T,>({
  label,
  count,
  index,
  delayStep = 0.1,
  accentClassName = "border-border/40",
  dotClassName = "bg-primary",
  items,
  renderItem,
  emptyIcon,
  emptyMessage,
  headerClassName = DEFAULT_HEADER_CLASS,
  labelFontSize = 14,
  bodyClassName = DEFAULT_BODY_CLASS,
}: KanbanColumnProps<T>) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * delayStep }}
    className={`bg-card/20 backdrop-blur-md border ${accentClassName} rounded-xl shadow-lg overflow-hidden`}
  >
    <div className={headerClassName}>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotClassName}`} />
        <span className="text-foreground" style={{ fontSize: labelFontSize }}>{label}</span>
      </div>
      <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
        {count ?? items.length}
      </span>
    </div>
    <div className={bodyClassName}>
      {items.length > 0 ? items.map(renderItem) : (
        <EmptyState icon={emptyIcon} message={emptyMessage} className="py-8" />
      )}
    </div>
  </motion.div>
);

export default KanbanColumn;
