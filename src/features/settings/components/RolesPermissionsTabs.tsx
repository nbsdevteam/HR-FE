import { ShieldCheck, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { TabButton, TabGroup } from "@/shared/components";
import type { RolesPermissionsTabId } from "../types";

type TRolesPermissionsTabsProps = {
  activeTab: RolesPermissionsTabId;
  onTabChange: (tabId: RolesPermissionsTabId) => void;
};

const TABS = [
  { id: "users" as const, labelKey: "settings.roles_permissions_tab_users" as const, icon: Users },
  { id: "job_roles" as const, labelKey: "settings.roles_permissions_tab_roles" as const, icon: ShieldCheck },
];

const RolesPermissionsTabs = ({ activeTab, onTabChange }: TRolesPermissionsTabsProps) => (
  <TabGroup>
    {TABS.map((tab) => (
      <TabButton
        key={tab.id}
        id={tab.id}
        label={arabicSource(tab.labelKey)}
        icon={tab.icon}
        isActive={activeTab === tab.id}
        onSelect={onTabChange}
      />
    ))}
  </TabGroup>
);

export default RolesPermissionsTabs;
