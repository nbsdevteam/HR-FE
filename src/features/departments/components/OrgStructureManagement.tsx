import { useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useDepartmentMetadata } from "@/shared/hooks";
import type { OrgStructureTab } from "../types";
import { useOrgStructureTree } from "../hooks/useOrgStructureTree";
import OrgStructureUnassignedBanner from "./OrgStructureUnassignedBanner";
import OrgStructureTabs from "./OrgStructureTabs";
import OrgStructureTreeView from "./OrgStructureTreeView";
import DepartmentsManagementSection from "./DepartmentsManagementSection";
import DesignationsManagementSection from "./DesignationsManagementSection";

type OrgStructureManagementProps = {
  onBack: () => void;
};

const OrgStructureManagement = ({ onBack }: OrgStructureManagementProps) => {
  const [tab, setTab] = useState<OrgStructureTab>("tree");
  const [treeIncludeArchived, setTreeIncludeArchived] = useState(false);
  const { metadata } = useDepartmentMetadata();
  const tree = useOrgStructureTree(treeIncludeArchived);

  const handleTreeIncludeArchivedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setTreeIncludeArchived(e.target.checked);
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-1 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          {arabicSource("org_structure.back_to_hierarchy")}
        </button>
        <h1 className="text-gradient-gold">
          {arabicSource("org_structure.management_title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {arabicSource("org_structure.management_subtitle")}
        </p>
        ewqw
      </div>

      <OrgStructureUnassignedBanner count={tree.unassignedEmployeeCount} />

      <OrgStructureTabs tab={tab} onTabChange={setTab} />

      {tab === "tree" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-muted-foreground text-sm cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={treeIncludeArchived}
              onChange={handleTreeIncludeArchivedChange}
            />
            {arabicSource("org_structure.include_archived_label")}
          </label>
          <OrgStructureTreeView
            items={tree.items}
            loading={tree.loading}
            expandedIds={tree.expandedIds}
            onToggleExpand={tree.toggleExpand}
          />
        </div>
      )}

      {tab === "departments" && (
        <DepartmentsManagementSection metadata={metadata} />
      )}
      {tab === "designations" && (
        <DesignationsManagementSection metadata={metadata} />
      )}
    </div>
  );
};

export default OrgStructureManagement;
