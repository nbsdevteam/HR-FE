import PublicLeaveTypeChip from "./PublicLeaveTypeChip";
import type { PublicLeaveTypeOption } from "../types/publicLeave";

type PublicLeaveTypePickerProps = {
  leaveTypes: PublicLeaveTypeOption[];
  selectedId: number | null;
  onSelect: (leaveTypeId: number) => void;
};

const PublicLeaveTypePicker = ({ leaveTypes, selectedId, onSelect }: PublicLeaveTypePickerProps) => (
  <div className="flex flex-wrap gap-2">
    {leaveTypes.map((leaveType) => (
      <PublicLeaveTypeChip
        key={leaveType.id}
        leaveType={leaveType}
        selected={leaveType.id === selectedId}
        onSelect={onSelect}
      />
    ))}
  </div>
);

export default PublicLeaveTypePicker;
