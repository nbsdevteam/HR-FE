import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { LeaveTabId, LeaveViewMode } from "../types";

type LeaveHeaderProps = {
  activeTab: LeaveTabId;
  viewMode: LeaveViewMode;
  onViewModeChange: (viewMode: LeaveViewMode) => void;
  onShowLeaveForm: () => void;
  onShowPermissionForm: () => void;
};

export const LeaveHeader = ({
  activeTab,
  viewMode,
  onViewModeChange,
  onShowLeaveForm,
  onShowPermissionForm,
}: LeaveHeaderProps) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("leave.leave_management")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("leave.follow_up_on_requests_for_leave_balances_and_authorizations")}</p>
    </div>
    <div className="flex items-center gap-3">
      {activeTab === "requests" && <ViewToggle view={viewMode} onChange={onViewModeChange} />}
      {activeTab === "requests" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowLeaveForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {arabicSource("leave.leave_request")}
        </motion.button>
      )}
      {activeTab === "permissions" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowPermissionForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {arabicSource("leave.asking_for_permission")}
        </motion.button>
      )}
    </div>
  </div>
);
