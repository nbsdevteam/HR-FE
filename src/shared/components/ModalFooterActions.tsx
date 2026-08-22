import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

interface ModalFooterActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  confirmIcon?: ComponentType<{ className?: string }>;
  confirmClassName?: string;
  confirmStyle?: CSSProperties;
  cancelClassName?: string;
  cancelDisabled?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
  /** Render confirm before cancel (e.g. a "Save" primary action leading). */
  reverseOrder?: boolean;
  /** Full replacement for the wrapper's className (not merged). */
  wrapperClassName?: string;
}

const DEFAULT_WRAPPER = "px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3";
const DEFAULT_CANCEL = "px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors";
const DEFAULT_CONFIRM = "bg-primary text-primary-foreground hover:bg-primary/90";

/**
 * Shared modal footer confirm/cancel row, factored out of the near-identical
 * versions departments and training each built independently.
 */
const ModalFooterActions = ({
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel = arabicSource("common.cancel"),
  confirmIcon: ConfirmIcon,
  confirmClassName = DEFAULT_CONFIRM,
  confirmStyle,
  cancelClassName = DEFAULT_CANCEL,
  cancelDisabled = false,
  disabled = false,
  loading = false,
  loadingLabel,
  reverseOrder = false,
  wrapperClassName = DEFAULT_WRAPPER,
}: ModalFooterActionsProps) => {
  const cancelButton = (
    <button key="cancel" onClick={onCancel} disabled={cancelDisabled} className={`${cancelClassName} disabled:opacity-50`} style={{ fontSize: 13 }}>
      {cancelLabel}
    </button>
  );
  const confirmButton = (
    <button key="confirm" onClick={onConfirm} disabled={disabled}
      className={`px-5 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${confirmClassName}`}
      style={{ fontSize: 13, ...confirmStyle }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : ConfirmIcon ? <ConfirmIcon className="w-4 h-4" /> : null}
      {loading && loadingLabel ? loadingLabel : confirmLabel}
    </button>
  );

  return (
    <div className={wrapperClassName}>
      {reverseOrder ? (
        <>
          {confirmButton}
          {cancelButton}
        </>
      ) : (
        <>
          {cancelButton}
          {confirmButton}
        </>
      )}
    </div>
  );
};

export default ModalFooterActions;
