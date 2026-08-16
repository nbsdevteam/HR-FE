import { useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { BalancesTab } from "../components/BalancesTab";
import { LeaveHeader } from "../components/LeaveHeader";
import { LeaveRequestFilters } from "../components/LeaveRequestFilters";
import { LeaveRequestModal } from "../components/LeaveRequestModal";
import { LeaveRequestsKanbanView } from "../components/LeaveRequestsKanbanView";
import { LeaveRequestsListView } from "../components/LeaveRequestsListView";
import { LeaveStats } from "../components/LeaveStats";
import { LeaveTabs } from "../components/LeaveTabs";
import { PermissionModal } from "../components/PermissionModal";
import { PermissionsTab } from "../components/PermissionsTab";
import { useLeavePage } from "../hooks/useLeavePage";
import type { LeaveTabId, LeaveViewMode } from "../types";

export const Leave = () => {
  const {
    activeLeaveTypes,
    activeTab,
    approvedCount,
    balances,
    balLoading,
    currentYear,
    employeeLinkError,
    employees,
    empLoading,
    empMap,
    filter,
    filteredRequests,
    handleApprove,
    handleDelete,
    handleLeaveSubmit,
    handlePermissionSubmit,
    handleReject,
    leaveSortBy,
    leaveSortDir,
    loading,
    pendingCount,
    permissions,
    permLoading,
    policies,
    refetchPermissions,
    rejectedCount,
    search,
    selfOnly,
    setActiveTab,
    setFilter,
    setLeaveSortBy,
    setLeaveSortDir,
    setSearch,
    setShowForm,
    setShowPermForm,
    setViewMode,
    showForm,
    showPermForm,
    viewMode,
  } = useLeavePage();

  const handleTabChange = useCallback((tabId: LeaveTabId) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleViewModeChange = useCallback((nextViewMode: LeaveViewMode) => {
    setViewMode(nextViewMode);
  }, [setViewMode]);

  const handleShowLeaveForm = useCallback(() => {
    setShowForm(true);
  }, [setShowForm]);

  const handleCloseLeaveForm = useCallback(() => {
    setShowForm(false);
  }, [setShowForm]);

  const handleShowPermissionForm = useCallback(() => {
    setShowPermForm(true);
  }, [setShowPermForm]);

  const handleClosePermissionForm = useCallback(() => {
    setShowPermForm(false);
  }, [setShowPermForm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("leave.loading_vacation_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LeaveHeader
        activeTab={activeTab}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onShowLeaveForm={handleShowLeaveForm}
        onShowPermissionForm={handleShowPermissionForm}
      />

      <LeaveStats pendingCount={pendingCount} approvedCount={approvedCount} rejectedCount={rejectedCount} />

      <LeaveTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <AnimatePresence mode="wait">
        {activeTab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <LeaveRequestFilters
              filter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
            />

            {viewMode === "list" ? (
              <LeaveRequestsListView
                requests={filteredRequests}
                empMap={empMap}
                leaveTypes={activeLeaveTypes}
                sortBy={leaveSortBy}
                sortDir={leaveSortDir}
                onSortByChange={setLeaveSortBy}
                onSortDirChange={setLeaveSortDir}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
              />
            ) : (
              <LeaveRequestsKanbanView
                requests={filteredRequests}
                empMap={empMap}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </motion.div>
        )}

        {activeTab === "balances" && (
          <motion.div key="balances" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BalancesTab
              employees={employees}
              leaveTypes={activeLeaveTypes}
              balances={balances}
              policies={policies}
              loading={balLoading}
              year={currentYear}
            />
          </motion.div>
        )}

        {activeTab === "permissions" && (
          <motion.div key="permissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PermissionsTab
              permissions={permissions}
              empMap={empMap}
              loading={permLoading}
              refetch={refetchPermissions}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <LeaveRequestModal
            employees={employees}
            leaveTypes={activeLeaveTypes}
            balances={balances}
            selfOnly={selfOnly}
            linkError={employeeLinkError}
            employeesLoading={empLoading}
            onClose={handleCloseLeaveForm}
            onSubmit={handleLeaveSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPermForm && (
          <PermissionModal
            employees={employees}
            onClose={handleClosePermissionForm}
            onSubmit={handlePermissionSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
