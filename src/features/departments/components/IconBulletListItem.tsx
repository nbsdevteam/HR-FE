import type { ComponentType, ReactNode } from "react";

type IconBulletListItemProps = {
  icon: ComponentType<{ className?: string }>;
  colorClassName: string;
  label: ReactNode;
  children: ReactNode;
};

const IconBulletListItem = ({ icon: Icon, colorClassName, label, children }: IconBulletListItemProps) => (
  <li className="flex items-center gap-1.5">
    <Icon className={`w-3 h-3 ${colorClassName}`} /> <strong className={colorClassName}>{label}</strong> {children}
  </li>
);

export default IconBulletListItem;
