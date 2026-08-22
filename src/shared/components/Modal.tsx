import type { ComponentType, ReactNode } from "react";
import ModalOverlay from "./ModalOverlay";
import ModalHeader from "./ModalHeader";

interface ModalProps {
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Typically a `<ModalFooterActions>`; omit for no footer. */
  footer?: ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  bodyClassName?: string;
}

const DEFAULT_CONTENT_CLASS = "bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg mx-4";
const DEFAULT_BODY_CLASS = "p-6 space-y-4";

/**
 * Composite modal — overlay + header + body slot + optional footer — for
 * callers that would otherwise assemble ModalOverlay/ModalHeader/
 * ModalFooterActions by hand every time.
 */
const Modal = ({
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  overlayClassName,
  contentClassName = DEFAULT_CONTENT_CLASS,
  bodyClassName = DEFAULT_BODY_CLASS,
}: ModalProps) => (
  <ModalOverlay onClose={onClose} overlayClassName={overlayClassName} contentClassName={contentClassName}>
    <ModalHeader title={title} subtitle={subtitle} icon={icon} onClose={onClose} />
    <div className={bodyClassName}>{children}</div>
    {footer}
  </ModalOverlay>
);

export default Modal;
