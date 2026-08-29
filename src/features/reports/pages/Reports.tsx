import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { useReportTemplateMetadata } from "@/shared/hooks";
import ReportConfigManagement from "../components/ReportConfigManagement";
import ReportsWorkspace from "../components/ReportsWorkspace";

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { metadata } = useReportTemplateMetadata();

  const handleBack = useCallback((): void => {
    setSearchParams({});
  }, [setSearchParams]);

  const showManagement = searchParams.get("tab") === "manage" && Boolean(metadata?.canManage);

  return showManagement ? <ReportConfigManagement onBack={handleBack} /> : <ReportsWorkspace />;
};

export default Reports;
