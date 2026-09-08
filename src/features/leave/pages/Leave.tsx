import { useCallback, useEffect } from "react";
import LeaveHeader from "../components/LeaveHeader";
import LeaveStats from "../components/LeaveStats";
import LeaveTabContent from "../components/LeaveTabContent";
import LeaveTabs from "../components/LeaveTabs";
import LoadingState from "@/shared/components/LoadingState";
import { arabicSource } from "@/i18n/source";
import { useCommandIntent } from "@/app/components/command-palette/CommandIntentContext";
import { useLeavePage } from "../hooks/useLeavePage";
import type { LeaveTabId, LeaveViewMode } from "../types";
import { lazy, Suspense } from "react";
const LeaveModals = lazy(() => import("../components/LeaveModals"));

const Leave = () => {
  const page = useLeavePage();
  const { setActiveTab, setShowForm, setShowPermForm, setViewMode } = page;
  const { pendingModalId, consumeModal } = useCommandIntent();

  const handleTabChange = useCallback(
    (tabId: LeaveTabId) => {
      setActiveTab(tabId);
    },
    [setActiveTab],
  );

  const handleViewModeChange = useCallback(
    (nextViewMode: LeaveViewMode) => {
      setViewMode(nextViewMode);
    },
    [setViewMode],
  );

  const handleShowLeaveForm = useCallback(() => {
    setShowForm(true);
  }, [setShowForm]);

  const handleShowPermissionForm = useCallback(() => {
    setShowPermForm(true);
  }, [setShowPermForm]);

  useEffect(() => {
    if (pendingModalId === "leave.request") {
      setShowForm(true);
      consumeModal("leave.request");
    } else if (pendingModalId === "leave.permission") {
      setShowPermForm(true);
      consumeModal("leave.permission");
    }
  }, [pendingModalId, setShowForm, setShowPermForm, consumeModal]);

  if (page.loading) {
    return (
      <LoadingState message={arabicSource("leave.loading_vacation_data")} />
    );
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
      <Suspense fallback={null}>
        <LeaveModals page={page} />
      </Suspense>{" "}
    </div>
  );
};

export default Leave;
