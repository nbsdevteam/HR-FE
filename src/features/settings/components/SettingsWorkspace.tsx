import { useToast } from "../hooks/useToast";
import ConfigurationsCard from "./ConfigurationsCard";
import ContractTypesCard from "./ContractTypesCard";
import DepartmentColorsCard from "./DepartmentColorsCard";
import DeviceSyncPauseCard from "./DeviceSyncPauseCard";
import DocumentTypesCard from "./DocumentTypesCard";
import LeaveTypesCard from "./LeaveTypesCard";
import NotificationsCard from "./NotificationsCard";
import PersonalAccountCard from "./PersonalAccountCard";
import PublicHolidaysCard from "./PublicHolidaysCard";
import PublicLeaveLinksCard from "./PublicLeaveLinksCard";
import SecurityCard from "./SecurityCard";
import SettingsPageHeader from "./SettingsPageHeader";
import Toast from "@/shared/components/Toast";
import ShiftsScheduleCard from "./ShiftsScheduleCard";
import SystemDisplayCard from "./SystemDisplayCard";
import SystemModulesCard from "./SystemModulesCard";

const SettingsWorkspace = () => {
  const { toastMessage, showToast } = useToast();

  return (
    <div className="space-y-4">
      {toastMessage && (
        <Toast
          message={toastMessage}
          shape="banner"
          position="top-full"
          toneClassName="bg-toast-success border border-toast-success-border shadow-lg"
          textClassName="text-toast-success-fg font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        />
      )}

      <SettingsPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DepartmentColorsCard showToast={showToast} />
        <ShiftsScheduleCard showToast={showToast} />
        <SystemModulesCard showToast={showToast} />
        <DeviceSyncPauseCard showToast={showToast} />
        <ConfigurationsCard showToast={showToast} />
        <PublicHolidaysCard showToast={showToast} />
        <LeaveTypesCard showToast={showToast} />
        <PublicLeaveLinksCard showToast={showToast} />
        <ContractTypesCard showToast={showToast} />
        <DocumentTypesCard showToast={showToast} />
        <PersonalAccountCard />
        <NotificationsCard />
        <SecurityCard />
        <SystemDisplayCard />
      </div>
    </div>
  );
};

export default SettingsWorkspace;
