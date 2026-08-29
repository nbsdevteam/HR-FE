import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import LeaveRequestFilters from "./LeaveRequestFilters";
import LeaveRequestsListView from "./LeaveRequestsListView";
import type { useLeavePage } from "../hooks/useLeavePage";

const BalancesTab = lazy(() => import("./BalancesTab"));
const LeaveRequestsKanbanView = lazy(() => import("./LeaveRequestsKanbanView"));
const PermissionsTab = lazy(() => import("./PermissionsTab"));

type LeaveTabContentProps = {
  page: ReturnType<typeof useLeavePage>;
};

const LeaveTabContent = ({ page }: LeaveTabContentProps) => (
  <AnimatePresence mode="wait">
    {page.activeTab === "requests" && (
      <motion.div
        key="requests"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <LeaveRequestFilters
          filter={page.filter}
          search={page.search}
          onFilterChange={page.setFilter}
          onSearchChange={page.setSearch}
        />

        {page.viewMode === "list" ? (
          <LeaveRequestsListView
            requests={page.filteredRequests}
            empMap={page.empMap}
            leaveTypes={page.activeLeaveTypes}
            sortBy={page.leaveSortBy}
            sortDir={page.leaveSortDir}
            onSortByChange={page.setLeaveSortBy}
            onSortDirChange={page.setLeaveSortDir}
            onApprove={page.handleApprove}
            onReject={page.handleReject}
            onDelete={page.handleDelete}
            onViewAttachments={page.handleViewAttachments}
          />
        ) : (
          <Suspense fallback={null}>
            <LeaveRequestsKanbanView
              requests={page.filteredRequests}
              empMap={page.empMap}
              onApprove={page.handleApprove}
              onReject={page.handleReject}
              onViewAttachments={page.handleViewAttachments}
            />
          </Suspense>
        )}
      </motion.div>
    )}

    {page.activeTab === "balances" && (
      <motion.div
        key="balances"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Suspense fallback={null}>
          <BalancesTab
            employees={page.employees}
            leaveTypes={page.activeLeaveTypes}
            balances={page.balances}
            policies={page.policies}
            loading={page.balLoading}
            year={page.currentYear}
            selfOnly={page.selfOnly}
          />
        </Suspense>
      </motion.div>
    )}

    {page.activeTab === "permissions" && (
      <motion.div
        key="permissions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Suspense fallback={null}>
          <PermissionsTab
            permissions={page.permissions}
            empMap={page.empMap}
            loading={page.permLoading}
            refetch={page.refetchPermissions}
          />
        </Suspense>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LeaveTabContent;
