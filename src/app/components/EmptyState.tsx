import { motion } from "motion/react";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  /** Optional sub-message / hint */
  hint?: string;
  /** Height class — defaults to py-12 */
  className?: string;
}

/**
 * Shared empty-state placeholder with icon, message, and optional hint.
 * Use inside tables (wrap in <td colSpan>), card bodies, or standalone sections.
 */
export function EmptyState({ icon: Icon = Inbox, message, hint, className = "py-12" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
        <Icon className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground" style={{ fontSize: 14 }}>{message}</p>
      {hint && <p className="text-muted-foreground/60" style={{ fontSize: 12 }}>{hint}</p>}
    </motion.div>
  );
}
