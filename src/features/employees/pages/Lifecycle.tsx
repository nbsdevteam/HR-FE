import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import ContractsTab from "../components/ContractsTab";
import LifecycleHeader from "../components/LifecycleHeader";
import LifecycleStats from "../components/LifecycleStats";
import LifecycleTabs from "../components/LifecycleTabs";
import ProbationAlerts from "../components/ProbationAlerts";
import { useLifecyclePage } from "../hooks/useLifecyclePage";
import LoadingState from "@/shared/components/LoadingState";

const DocumentsTab = lazy(() => import("../components/DocumentsTab"));
const ExitTab = lazy(() => import("../components/ExitTab"));

const Lifecycle = () => {
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
    return <LoadingState message={arabicSource("common.loading")} />;
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
          <motion.div
            key="contracts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
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
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Suspense fallback={<LoadingState message={arabicSource("common.loading")} />}>
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
            </Suspense>
          </motion.div>
        )}
        {activeTab === "exit" && (
          <motion.div
            key="exit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Suspense fallback={<LoadingState message={arabicSource("common.loading")} />}>
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
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lifecycle;
