import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalHeaderProps {
  title: ReactNode;
  /** Optional line rendered under the title (e.g. a step description). */
  subtitle?: ReactNode;
  onClose: () => void;
  /** Full replacement for the wrapper's className (not merged). */
  className?: string;
}

const DEFAULT_CLASS = "flex items-center justify-between mb-6";

/**
 * Shared "title + X close button" modal/panel header, factored out of the
 * near-identical versions training and warnings each built independently.
 */
const ModalHeader = ({
  title,
  subtitle,
  onClose,
  className,
}: ModalHeaderProps) => (
  <div className={className ?? DEFAULT_CLASS}>
    <div>
      <h2 className="text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {subtitle}
        </p>
      )}
    </div>
    <button
      onClick={onClose}
      className="p-1 rounded hover:bg-secondary cursor-pointer"
    >
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  </div>
);

export default ModalHeader;
