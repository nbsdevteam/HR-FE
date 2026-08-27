import { useHierarchyData } from "@/shared/hooks";
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
import SecurityCard from "./SecurityCard";
import SettingsPageHeader from "./SettingsPageHeader";
import Toast from "@/shared/components/Toast";
import ShiftsScheduleCard from "./ShiftsScheduleCard";
import SystemDisplayCard from "./SystemDisplayCard";
import SystemModulesCard from "./SystemModulesCard";

const SettingsWorkspace = () => {
  const { toastMessage, showToast } = useToast();
  const { departments, loading: deptLoading } = useHierarchyData();

  return (
    <div className="space-y-4">
      {toastMessage && (
        <Toast
          message={toastMessage}
          shape="banner"
          position="top-full"
          toneClassName="bg-green-500/20 border border-green-500/50"
          textClassName="text-green-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        />
      )}

      <SettingsPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DepartmentColorsCard
          departments={departments}
          deptLoading={deptLoading}
          showToast={showToast}
        />
        <ShiftsScheduleCard
          departments={departments}
          deptLoading={deptLoading}
          showToast={showToast}
        />
        <SystemModulesCard showToast={showToast} />
        <DeviceSyncPauseCard showToast={showToast} />
        <ConfigurationsCard showToast={showToast} />
        <PublicHolidaysCard showToast={showToast} />
        <LeaveTypesCard showToast={showToast} />
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
