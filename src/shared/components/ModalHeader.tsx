import type { ComponentType, CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface ModalHeaderProps {
  title: ReactNode;
  /** Optional line rendered under the title (e.g. a step description). */
  subtitle?: ReactNode;
  onClose: () => void;
  /** When set, renders the icon-badge variant instead of the plain title variant. */
  icon?: ComponentType<{ className?: string }>;
  /** Full replacement for the wrapper's className (plain variant only, not merged). */
  className?: string;
  /** Icon-badge variant only. */
  headerClassName?: string;
  headerStyle?: CSSProperties;
  iconBadgeClassName?: string;
  iconBadgeStyle?: CSSProperties;
  iconColorClassName?: string;
  wrapperClassName?: string;
}

const DEFAULT_CLASS = "flex items-center justify-between mb-6";

/**
 * Shared modal/panel header, factored out of the near-identical versions
 * training, warnings, and departments each built independently. Pass `icon`
 * to render the icon-badge variant; omit it for the plain title variant.
 */
const ModalHeader = ({
  title,
  subtitle,
  onClose,
  icon: Icon,
  className,
  headerClassName = "bg-primary/10",
  headerStyle,
  iconBadgeClassName = "bg-primary/20",
  iconBadgeStyle,
  iconColorClassName = "text-primary",
  wrapperClassName = "",
}: ModalHeaderProps) => {
  if (Icon) {
    return (
      <div
        className={`px-6 py-4 flex items-center justify-between ${headerClassName} ${wrapperClassName}`}
        style={headerStyle}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBadgeClassName}`}
            style={iconBadgeStyle}
          >
            <Icon className={`w-5 h-5 ${iconColorClassName}`} />
          </div>
          <div>
            <h3 className="text-foreground" style={{ fontSize: 15 }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="unstyled"
          size="unstyled"
          rounded="rounded-lg"
          icon={X}
          onClick={onClose}
          className="w-8 h-8 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
        />
      </div>
    );
  }

  return (
    <div className={className ?? DEFAULT_CLASS}>
      <div>
        <h2 className="text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {subtitle}
          </p>
        )}
      </div>
      <Button
        variant="unstyled"
        size="unstyled"
        rounded="rounded"
        icon={X}
        iconClassName="w-5 h-5 text-muted-foreground"
        onClick={onClose}
        className="p-1 hover:bg-secondary"
      />
    </div>
  );
};

export default ModalHeader;
