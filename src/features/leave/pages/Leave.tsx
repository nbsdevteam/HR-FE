import { useCallback } from "react";
import LeaveHeader from "../components/LeaveHeader";
import LeaveLoadingState from "../components/LeaveLoadingState";
import LeaveModals from "../components/LeaveModals";
import LeaveStats from "../components/LeaveStats";
import LeaveTabContent from "../components/LeaveTabContent";
import LeaveTabs from "../components/LeaveTabs";
import { useLeavePage } from "../hooks/useLeavePage";
import type { LeaveTabId, LeaveViewMode } from "../types";

export const Leave = () => {
  const page = useLeavePage();
  const { setActiveTab, setShowForm, setShowPermForm, setViewMode } = page;

  const handleTabChange = useCallback((tabId: LeaveTabId) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleViewModeChange = useCallback((nextViewMode: LeaveViewMode) => {
    setViewMode(nextViewMode);
  }, [setViewMode]);

  const handleShowLeaveForm = useCallback(() => {
    setShowForm(true);
  }, [setShowForm]);

  const handleShowPermissionForm = useCallback(() => {
    setShowPermForm(true);
  }, [setShowPermForm]);

  if (page.loading) {
    return <LeaveLoadingState />;
  }

  return (
    <div className="space-y-6">
      <LeaveHeader
        activeTab={page.activeTab}
        viewMode={page.viewMode}
        onViewModeChange={handleViewModeChange}
        onShowLeaveForm={handleShowLeaveForm}
        onShowPermissionForm={handleShowPermissionForm}
      />

      <LeaveStats
        pendingCount={page.pendingCount}
        approvedCount={page.approvedCount}
        rejectedCount={page.rejectedCount}
      />

      <LeaveTabs activeTab={page.activeTab} onTabChange={handleTabChange} />

      <LeaveTabContent page={page} />

      <LeaveModals page={page} />
    </div>
  );
};
