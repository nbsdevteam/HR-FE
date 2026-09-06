import { arabicSource } from "@/i18n/source";
import type { DbLeaveType, LeaveBalanceResetPolicy } from "@/shared/hooks";
import LeaveTypeListItem from "./LeaveTypeListItem";

type TLeaveTypeListProps = {
  leaveTypes: DbLeaveType[];
  loading: boolean;
  onToggleActive: (leaveType: DbLeaveType) => void;
  onDelete: (leaveTypeId: string) => void;
  onUpdateDays: (leaveTypeId: string, defaultDaysPerYear: number) => void;
  onUpdateResetPolicy: (leaveTypeId: string, policy: LeaveBalanceResetPolicy) => void;
};

const LeaveTypeList = ({
  leaveTypes,
  loading,
  onToggleActive,
  onDelete,
  onUpdateDays,
  onUpdateResetPolicy,
}: TLeaveTypeListProps) => {
  if (loading) {
    return (
      <div className="text-muted-foreground text-center py-6 text-sm">
        {arabicSource("common.loading")}
      </div>
    );
  }
  if (leaveTypes.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-6 text-sm">
        {arabicSource("settings.there_are_no_leave_types")}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {leaveTypes?.map((leaveType) => (
        <LeaveTypeListItem
          key={leaveType.id}
          leaveType={leaveType}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          onUpdateDays={onUpdateDays}
          onUpdateResetPolicy={onUpdateResetPolicy}
        />
      ))}
    </div>
  );
};

export default LeaveTypeList;
