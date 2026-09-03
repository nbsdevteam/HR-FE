import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import ViewToggle from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { LeaveTabId, LeaveViewMode } from "../types";

type LeaveHeaderProps = {
  activeTab: LeaveTabId;
  viewMode: LeaveViewMode;
  onViewModeChange: (viewMode: LeaveViewMode) => void;
  onShowLeaveForm: () => void;
  onShowPermissionForm: () => void;
};

const ACTION_BUTTON_CLASS = "px-5 py-2.5 shadow-lg shadow-primary/20 cursor-pointer";

const LeaveHeader = ({
  activeTab,
  viewMode,
  onViewModeChange,
  onShowLeaveForm,
  onShowPermissionForm,
}: LeaveHeaderProps) => (
  <div className="flex flex-col min-[970px]:flex-row items-start min-[970px]:items-center justify-between gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("leave.leave_management")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("leave.follow_up_on_requests_for_leave_balances_and_authorizations")}</p>
    </div>
    <div className="flex items-center gap-3">
      {activeTab === "requests" && (
        <>
          <ViewToggle view={viewMode} onChange={onViewModeChange} />
          <Button icon={Plus} onClick={onShowLeaveForm} className={ACTION_BUTTON_CLASS}>
            {arabicSource("leave.leave_request")}
          </Button>
        </>
      )}
      {activeTab === "permissions" && (
        <Button icon={Plus} onClick={onShowPermissionForm} className={ACTION_BUTTON_CLASS}>
          {arabicSource("leave.asking_for_permission")}
        </Button>
      )}
    </div>
  </div>
);

export default LeaveHeader;
