import { motion } from "motion/react";
import { Check, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbShift } from "@/shared/hooks";
import { getWorkingDayLabels } from "../utils/shiftHelpers";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import ShiftEditForm from "./ShiftEditForm";
import ShiftScheduleTable from "./ShiftScheduleTable";

type TShiftListItemProps = {
  shift: DbShift;
  isExpanded: boolean;
  editingForm: ShiftEditState | null;
  onToggleExpand: () => void;
  onInitEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditFieldChange: (patch: Partial<ShiftEditState>) => void;
  onEditDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
};

const ShiftListItem = ({
  shift,
  isExpanded,
  editingForm,
  onToggleExpand,
  onInitEdit,
  onDelete,
  onSetDefault,
  onCancelEdit,
  onSaveEdit,
  onEditFieldChange,
  onEditDayChange,
}: TShiftListItemProps) => {
  const isEditing = editingForm?.id === shift.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-muted/10 border border-border/20 rounded-lg overflow-hidden"
    >
      <div
        onClick={onToggleExpand}
        className="px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="text-foreground shrink-0" style={{ fontSize: 13 }}>
              {shift.name}
            </h4>
            {shift.is_default && (
              <span
                className="px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-primary rounded-full shrink-0"
                style={{ fontSize: 10 }}
              >
                {arabicSource("settings.default")}
              </span>
            )}
            <span
              className="text-muted-foreground truncate"
              style={{ fontSize: 11 }}
            >
              {shift.description}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              {getWorkingDayLabels(shift).map((label) => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded"
                  style={{ fontSize: 10 }}
                >
                  {label}
                </span>
              ))}
            </div>
            <span className="text-muted-foreground" style={{ fontSize: 10 }}>
              {shift.grace_minutes}
              {arabicSource("settings.d")} {shift.target_hours_per_day}
              {arabicSource("settings.s")}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {isExpanded && !isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border/20 px-3 py-3 bg-muted/5 space-y-3"
        >
          <ShiftScheduleTable shift={shift} />

          <div className="flex gap-2">
            <button
              onClick={onInitEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
              style={{ fontSize: 12 }}
            >
              <Edit2 className="w-3.5 h-3.5" /> {arabicSource("common.edit")}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
              style={{ fontSize: 12 }}
            >
              <Trash2 className="w-3.5 h-3.5" /> {arabicSource("common.delete")}
            </button>
            {!shift.is_default && (
              <button
                onClick={onSetDefault}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition-colors"
                style={{ fontSize: 12 }}
              >
                <Check className="w-3.5 h-3.5" />{" "}
                {arabicSource("settings.set_as_default")}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {isEditing && editingForm && (
        <ShiftEditForm
          form={editingForm}
          onFieldChange={onEditFieldChange}
          onDayChange={onEditDayChange}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      )}
    </motion.div>
  );
};

export default ShiftListItem;
