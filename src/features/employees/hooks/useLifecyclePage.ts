import { useState, useMemo } from "react";
import {
  useEmployees,
  empDisplayName,
  useContractTypes,
  useEmployeeContracts,
  useDocumentTypes,
  useEmployeeDocuments,
  useExitChecklistItems,
  useExitProcesses,
  useConfigurations,
} from "@/shared/hooks";
import {
  defaultChecklistCategoryLabels,
  defaultExitTypeLabels,
  defaultLifecycleStatusColors,
  defaultLifecycleStatusLabels,
} from "../styles/lifecycle";
import type { EmployeeMap, LifecycleTabId } from "../types/lifecycle";
import { parseKeyLabelMap } from "../utils/lifecycleConfig";

export const useLifecyclePage = () => {
  const [activeTab, setActiveTab] = useState<LifecycleTabId>("contracts");
  const [search, setSearch] = useState("");

  const { employees, loading: empLoading } = useEmployees();
  const { types: contractTypes } = useContractTypes();
  const { contracts, loading: contractsLoading, refetch: refetchContracts } = useEmployeeContracts();
  const { types: docTypes } = useDocumentTypes();
  const { documents, loading: docsLoading, refetch: refetchDocs } = useEmployeeDocuments();
  const { items: exitItems } = useExitChecklistItems();
  const { processes: exitProcesses, loading: exitLoading, refetch: refetchExit } = useExitProcesses();
  const { getValue, getNumber } = useConfigurations();

  const exitTypeLabels = useMemo(() => parseKeyLabelMap(
    getValue("lifecycle.exit_types", ""),
    defaultExitTypeLabels,
  ), [getValue]);

  const statusLabels = useMemo(() => parseKeyLabelMap(
    getValue("lifecycle.status_labels", ""),
    defaultLifecycleStatusLabels,
  ), [getValue]);

  const checklistCategoryLabels = useMemo(() => parseKeyLabelMap(
    getValue("lifecycle.exit_checklist_categories", ""),
    defaultChecklistCategoryLabels,
  ), [getValue]);

  const empMap = useMemo(() => {
    const map: EmployeeMap = {};
    employees.forEach(employee => { map[employee.id] = employee; });
    return map;
  }, [employees]);

  const employeeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach(employee => { map[String(employee.id)] = empDisplayName(employee); });
    return map;
  }, [employees]);

  const probationAlertDays = getNumber("lifecycle.probation_alert_days", 30);

  const activeContracts = useMemo(
    () => contracts.filter(contract => contract.status === "active").length,
    [contracts],
  );

  const expiringDocs = useMemo(
    () => documents.filter(document => document.status === "expiring_soon").length,
    [documents],
  );

  const activeExits = useMemo(
    () => exitProcesses.filter(process => process.status !== "completed" && process.status !== "cancelled").length,
    [exitProcesses],
  );

  const probationAlerts = useMemo(() => contracts.filter(contract => {
    if (contract.probation_status !== "pending" || !contract.probation_end_date) return false;
    const daysLeft = Math.ceil((new Date(contract.probation_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= probationAlertDays && daysLeft >= 0;
  }), [contracts, probationAlertDays]);

  const loading = empLoading || contractsLoading || docsLoading || exitLoading;

  return {
    activeContracts,
    activeExits,
    activeTab,
    checklistCategoryLabels,
    contractTypes,
    contracts,
    docTypes,
    documents,
    employees,
    empMap,
    employeeLabels,
    exitItems,
    exitProcesses,
    exitTypeLabels,
    expiringDocs,
    loading,
    probationAlerts,
    refetchContracts,
    refetchDocs,
    refetchExit,
    search,
    setActiveTab,
    setSearch,
    statusColors: defaultLifecycleStatusColors,
    statusLabels,
  };
};
