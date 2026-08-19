import type { ComponentType, CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";

type ModalHeaderProps = {
  icon: ComponentType<{ className?: string }>;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  headerClassName?: string;
  headerStyle?: CSSProperties;
  iconBadgeClassName?: string;
  iconBadgeStyle?: CSSProperties;
  iconColorClassName?: string;
  wrapperClassName?: string;
};

const ModalHeader = ({
  icon: Icon,
  title,
  subtitle,
  onClose,
  headerClassName = "bg-primary/10",
  headerStyle,
  iconBadgeClassName = "bg-primary/20",
  iconBadgeStyle,
  iconColorClassName = "text-primary",
  wrapperClassName = "",
}: ModalHeaderProps) => (
  <div className={`px-6 py-4 flex items-center justify-between ${headerClassName} ${wrapperClassName}`} style={headerStyle}>
    <div className="flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBadgeClassName}`} style={iconBadgeStyle}>
        <Icon className={`w-5 h-5 ${iconColorClassName}`} />
      </div>
      <div>
        <h3 className="text-foreground" style={{ fontSize: 15 }}>{title}</h3>
        {subtitle && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      <X className="w-4 h-4" />
    </button>
  </div>
);

export default ModalHeader;
