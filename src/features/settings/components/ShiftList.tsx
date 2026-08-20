import { arabicSource } from "@/i18n/source";
import type { DbShift } from "@/shared/hooks";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import ShiftListItem from "./ShiftListItem";

type TShiftListProps = {
  shifts: DbShift[];
  loading: boolean;
  expandedShift: string | null;
  editingForm: ShiftEditState | null;
  onToggleExpand: (shiftId: string) => void;
  onInitEdit: (shift: DbShift) => void;
  onDelete: (shiftId: string) => void;
  onSetDefault: (shiftId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (form: ShiftEditState) => void;
  onEditFieldChange: (patch: Partial<ShiftEditState>) => void;
  onEditDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
};

const ShiftList = ({
  shifts,
  loading,
  expandedShift,
  editingForm,
  onToggleExpand,
  onInitEdit,
  onDelete,
  onSetDefault,
  onCancelEdit,
  onSaveEdit,
  onEditFieldChange,
  onEditDayChange,
}: TShiftListProps) => {
  if (loading) {
    return (
      <div
        className="text-muted-foreground text-center py-4"
        style={{ fontSize: 13 }}
      >
        {arabicSource("common.loading")}
      </div>
    );
  }
  if (shifts.length === 0) {
    return (
      <div
        className="text-muted-foreground text-center py-4"
        style={{ fontSize: 13 }}
      >
        {arabicSource("settings.no_shifts")}
      </div>
    );
  }
  return (
    <>
      {shifts.map((shift) => (
        <ShiftListItem
          key={shift.id}
          shift={shift}
          isExpanded={expandedShift === shift.id}
          editingForm={editingForm}
          onToggleExpand={() => onToggleExpand(shift.id)}
          onInitEdit={() => onInitEdit(shift)}
          onDelete={() => onDelete(shift.id)}
          onSetDefault={() => onSetDefault(shift.id)}
          onCancelEdit={onCancelEdit}
          onSaveEdit={() => editingForm && onSaveEdit(editingForm)}
          onEditFieldChange={onEditFieldChange}
          onEditDayChange={onEditDayChange}
        />
      ))}
    </>
  );
};

export default ShiftList;
