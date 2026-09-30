import { useState, useMemo, useEffect } from "react";
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
import { lifecycleTabs, type EmployeeMap, type LifecycleTabId } from "../types/lifecycle";
import { parseKeyLabelMap } from "../utils/lifecycleConfig";

/** `?tab=exit` — how a clearance notification's link lands on its tab. */
const initialTab = (): LifecycleTabId => {
  if (typeof window === "undefined") return "contracts";
  const requested = new URLSearchParams(window.location.search).get("tab");
  return lifecycleTabs.some(tab => tab.id === requested) ? (requested as LifecycleTabId) : "contracts";
};

export const useLifecyclePage = () => {
  const [activeTab, setActiveTab] = useState<LifecycleTabId>(initialTab);
  const [search, setSearch] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

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

  const fetching = empLoading || contractsLoading || docsLoading || exitLoading;

  // The shared list hooks report `loading` for every background refetch too, and
  // a mutation (checklist toggle, save edit) invalidates them. Swapping the page
  // for the loader then would unmount the tabs and drop the open detail view, so
  // the loader is only for the first load.
  useEffect(() => {
    if (!fetching) setHasLoaded(true);
  }, [fetching]);

  const loading = fetching && !hasLoaded;

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
