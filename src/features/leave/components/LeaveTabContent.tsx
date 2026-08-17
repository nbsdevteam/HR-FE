import { AnimatePresence, motion } from "motion/react";
import BalancesTab from "./BalancesTab";
import LeaveRequestFilters from "./LeaveRequestFilters";
import LeaveRequestsKanbanView from "./LeaveRequestsKanbanView";
import LeaveRequestsListView from "./LeaveRequestsListView";
import PermissionsTab from "./PermissionsTab";
import type { useLeavePage } from "../hooks/useLeavePage";

type LeaveTabContentProps = {
  page: ReturnType<typeof useLeavePage>;
};

const LeaveTabContent = ({ page }: LeaveTabContentProps) => (
  <AnimatePresence mode="wait">
    {page.activeTab === "requests" && (
      <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
          />
        ) : (
          <LeaveRequestsKanbanView
            requests={page.filteredRequests}
            empMap={page.empMap}
            onApprove={page.handleApprove}
            onReject={page.handleReject}
          />
        )}
      </motion.div>
    )}

    {page.activeTab === "balances" && (
      <motion.div key="balances" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <BalancesTab
          employees={page.employees}
          leaveTypes={page.activeLeaveTypes}
          balances={page.balances}
          policies={page.policies}
          loading={page.balLoading}
          year={page.currentYear}
        />
      </motion.div>
    )}

    {page.activeTab === "permissions" && (
      <motion.div key="permissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <PermissionsTab
          permissions={page.permissions}
          empMap={page.empMap}
          loading={page.permLoading}
          refetch={page.refetchPermissions}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export default LeaveTabContent;
