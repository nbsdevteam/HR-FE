import { arabicSource } from "@/i18n/source";
import type { DbLeaveType } from "@/shared/hooks";
import LeaveTypeListItem from "./LeaveTypeListItem";

type TLeaveTypeListProps = {
  leaveTypes: DbLeaveType[];
  loading: boolean;
  onToggleActive: (leaveType: DbLeaveType) => void;
  onDelete: (leaveTypeId: string) => void;
};

const LeaveTypeList = ({
  leaveTypes,
  loading,
  onToggleActive,
  onDelete,
}: TLeaveTypeListProps) => {
  const handleToggleActiveClick = (leaveType: DbLeaveType) => (): void => {
    onToggleActive(leaveType);
  };

  const handleDeleteClick = (leaveTypeId: string) => (): void => {
    onDelete(leaveTypeId);
  };

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
          onToggleActive={handleToggleActiveClick(leaveType)}
          onDelete={handleDeleteClick(leaveType.id)}
        />
      ))}
    </div>
  );
};

export default LeaveTypeList;
