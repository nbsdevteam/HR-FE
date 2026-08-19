import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type ModalFooterActionsProps = {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: ReactNode;
  confirmIcon?: ComponentType<{ className?: string }>;
  confirmClassName?: string;
  confirmStyle?: CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
};

const ModalFooterActions = ({
  onCancel,
  onConfirm,
  confirmLabel,
  confirmIcon: ConfirmIcon,
  confirmClassName = "bg-primary text-primary-foreground hover:bg-primary/90",
  confirmStyle,
  disabled = false,
  loading = false,
  loadingLabel,
}: ModalFooterActionsProps) => (
  <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
    <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>
      {arabicSource("common.cancel")}
    </button>
    <button onClick={onConfirm} disabled={disabled}
      className={`px-5 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${confirmClassName}`}
      style={{ fontSize: 13, ...confirmStyle }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : ConfirmIcon ? <ConfirmIcon className="w-4 h-4" /> : null}
      {loading && loadingLabel ? loadingLabel : confirmLabel}
    </button>
  </div>
);

export default ModalFooterActions;
