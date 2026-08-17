import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import ContractsTab from "../components/ContractsTab";
import DocumentsTab from "../components/DocumentsTab";
import ExitTab from "../components/ExitTab";
import LifecycleHeader from "../components/LifecycleHeader";
import LifecycleStats from "../components/LifecycleStats";
import LifecycleTabs from "../components/LifecycleTabs";
import ProbationAlerts from "../components/ProbationAlerts";
import { useLifecyclePage } from "../hooks/useLifecyclePage";

export const Lifecycle = () => {
  const {
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
    statusColors,
    statusLabels,
  } = useLifecyclePage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LifecycleHeader />

      <LifecycleStats
        activeContracts={activeContracts}
        expiringDocs={expiringDocs}
        probationAlertsCount={probationAlerts.length}
        activeExits={activeExits}
      />

      <ProbationAlerts probationAlerts={probationAlerts} empMap={empMap} />

      <LifecycleTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === "contracts" && (
          <motion.div key="contracts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ContractsTab
              contracts={contracts}
              contractTypes={contractTypes}
              empMap={empMap}
              employees={employees}
              employeeLabels={employeeLabels}
              refetch={refetchContracts}
              search={search}
              onSearchChange={setSearch}
              statusLabels={statusLabels}
              statusColors={statusColors}
            />
          </motion.div>
        )}
        {activeTab === "documents" && (
          <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DocumentsTab
              documents={documents}
              docTypes={docTypes}
              empMap={empMap}
              employees={employees}
              employeeLabels={employeeLabels}
              refetch={refetchDocs}
              statusLabels={statusLabels}
              statusColors={statusColors}
            />
          </motion.div>
        )}
        {activeTab === "exit" && (
          <motion.div key="exit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ExitTab
              processes={exitProcesses}
              exitItems={exitItems}
              empMap={empMap}
              employees={employees}
              employeeLabels={employeeLabels}
              refetch={refetchExit}
              exitTypeLabels={exitTypeLabels}
              statusLabels={statusLabels}
              statusColors={statusColors}
              checklistCategoryLabels={checklistCategoryLabels}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
