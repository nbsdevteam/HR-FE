import { useHierarchyData } from "@/shared/hooks";
import { useToast } from "../hooks/useToast";
import { ConfigurationsCard } from "./ConfigurationsCard";
import { ContractTypesCard } from "./ContractTypesCard";
import { DepartmentColorsCard } from "./DepartmentColorsCard";
import { DocumentTypesCard } from "./DocumentTypesCard";
import { LeaveTypesCard } from "./LeaveTypesCard";
import { NotificationsCard } from "./NotificationsCard";
import { PersonalAccountCard } from "./PersonalAccountCard";
import { PublicHolidaysCard } from "./PublicHolidaysCard";
import { SecurityCard } from "./SecurityCard";
import { SettingsPageHeader } from "./SettingsPageHeader";
import { SettingsToast } from "./SettingsToast";
import { ShiftsScheduleCard } from "./ShiftsScheduleCard";
import { SystemDisplayCard } from "./SystemDisplayCard";
import { SystemModulesCard } from "./SystemModulesCard";

export const SettingsWorkspace = () => {
  const { toastMessage, showToast } = useToast();
  const { departments, loading: deptLoading } = useHierarchyData();

  return (
    <div className="space-y-4">
      {toastMessage && <SettingsToast message={toastMessage} />}

      <SettingsPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DepartmentColorsCard departments={departments} deptLoading={deptLoading} showToast={showToast} />
        <ShiftsScheduleCard departments={departments} deptLoading={deptLoading} showToast={showToast} />
        <SystemModulesCard showToast={showToast} />
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
