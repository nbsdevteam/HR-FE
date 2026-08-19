import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type PopoverHeaderProps = {
  icon: LucideIcon;
  iconBgClassName: string;
  iconColorClassName: string;
  title: ReactNode;
  subtitle: ReactNode;
  onClose: () => void;
};

const PopoverHeader = ({ icon: Icon, iconBgClassName, iconColorClassName, title, subtitle, onClose }: PopoverHeaderProps) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBgClassName}`}>
        <Icon className={`w-5 h-5 ${iconColorClassName}`} />
      </div>
      <div>
        <h3 className="text-foreground">{title}</h3>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{subtitle}</p>
      </div>
    </div>
    <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  </div>
);

export default PopoverHeader;
