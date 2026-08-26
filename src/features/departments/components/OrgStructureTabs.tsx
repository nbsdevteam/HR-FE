import { GitBranch, Building2, Briefcase } from "lucide-react";
import { TabButton, TabGroup } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgStructureTab } from "../types";

type OrgStructureTabsProps = {
  tab: OrgStructureTab;
  onTabChange: (tab: OrgStructureTab) => void;
};

const OrgStructureTabs = ({ tab, onTabChange }: OrgStructureTabsProps) => (
  <TabGroup>
    <TabButton
      id="tree"
      label={arabicSource("org_structure.tree_tab")}
      icon={GitBranch}
      isActive={tab === "tree"}
      onSelect={onTabChange}
    />
    <TabButton
      id="departments"
      label={arabicSource("org_structure.departments_tab")}
      icon={Building2}
      isActive={tab === "departments"}
      onSelect={onTabChange}
    />
    <TabButton
      id="designations"
      label={arabicSource("org_structure.job_titles_tab")}
      icon={Briefcase}
      isActive={tab === "designations"}
      onSelect={onTabChange}
    />
  </TabGroup>
);

export default OrgStructureTabs;
