import type { ComponentType, ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import ModalOverlay from "./ModalOverlay";
import ModalFooterActions from "./ModalFooterActions";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: ReactNode;
  loadingLabel?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
  contentClassName?: string;
}

const DEFAULT_CONTENT_CLASS = "bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl";

/**
 * Shared "confirm destructive action" dialog, factored out of the
 * near-identical delete-confirmation modals features were building per entity.
 */
const ConfirmDeleteModal = ({
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = arabicSource("common.delete"),
  loadingLabel,
  icon: Icon = Trash2,
  loading = false,
  contentClassName = DEFAULT_CONTENT_CLASS,
}: ConfirmDeleteModalProps) => (
  <ModalOverlay
    onClose={() => !loading && onClose()}
    contentClassName={contentClassName}
    contentMotionProps={{
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-destructive/10">
        <Icon className="w-5 h-5 text-destructive" />
      </div>
      <h3 className="text-foreground font-semibold" style={{ fontSize: 16 }}>{title}</h3>
    </div>
    <p className="text-muted-foreground mb-6" style={{ fontSize: 14 }}>{message}</p>
    <ModalFooterActions
      onCancel={onClose}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      confirmIcon={Icon}
      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      disabled={loading}
      cancelDisabled={loading}
      loading={loading}
      loadingLabel={loadingLabel}
      wrapperClassName="flex items-center gap-3 justify-end"
    />
  </ModalOverlay>
);

export default ConfirmDeleteModal;
