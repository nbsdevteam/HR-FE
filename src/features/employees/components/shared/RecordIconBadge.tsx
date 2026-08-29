import type { LucideIcon } from "lucide-react";

type RecordIconBadgeProps = {
  icon: LucideIcon;
  wrapperClassName: string;
  iconClassName: string;
};

const RecordIconBadge = ({ icon: Icon, wrapperClassName, iconClassName }: RecordIconBadgeProps) => (
  <div className={wrapperClassName}>
    <Icon className={iconClassName} />
  </div>
);

export default RecordIconBadge;
