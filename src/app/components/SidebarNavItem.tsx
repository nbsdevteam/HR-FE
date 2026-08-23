import { memo, useCallback } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

export type SidebarMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
};

type SidebarNavItemProps = {
  item: SidebarMenuItem;
  index: number;
  isActive: boolean;
  collapsed: boolean;
  onSelect: (path: string) => void;
};

/**
 * One sidebar link. Extracted from the inline `menuItems.map(...)` in
 * `Sidebar.tsx` so the nav's click handler is a single stable callback rather
 * than a fresh closure per item on every route change.
 */
const SidebarNavItem = ({ item, index, isActive, collapsed, onSelect }: SidebarNavItemProps) => {
  const Icon = item.icon;

  const handleClick = useCallback((): void => {
    onSelect(item.path);
  }, [onSelect, item.path]);

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
        isActive
          ? "bg-gradient-to-r from-primary via-primary to-gold-dark text-primary-foreground shadow-lg shadow-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <span className="truncate text-start" style={{ fontSize: 14 }}>
          {item.label}
        </span>
      )}
    </motion.button>
  );
};

export default memo(SidebarNavItem);
