import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { useDepartmentMetadata } from "@/shared/hooks";
import OrgStructureManagement from "../components/OrgStructureManagement";
import HierarchyChart from "./HierarchyChart";

const Hierarchy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { metadata } = useDepartmentMetadata();

  const handleBack = useCallback((): void => {
    setSearchParams({});
  }, [setSearchParams]);

  const showManagement = searchParams.get("tab") === "manage" && Boolean(metadata?.canManage);

  return showManagement ? <OrgStructureManagement onBack={handleBack} /> : <HierarchyChart />;
};

export default Hierarchy;
