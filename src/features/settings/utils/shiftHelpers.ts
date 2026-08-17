import type { DbShift } from "@/shared/hooks";
import { DAYS_OF_WEEK } from "../constants/settings";
import type { ShiftDaySchedule, ShiftEditState } from "../types";

export const createDefaultShiftDays = (): Record<string, ShiftDaySchedule> => (
  Object.fromEntries(
    DAYS_OF_WEEK.map((d) => [d.key, { is_working: d.key !== "friday", start: "08:00", end: "16:00" }]),
  )
);

export const shiftToEditState = (shift: DbShift): ShiftEditState => ({
  id: shift.id,
  name: shift.name,
  description: shift.description || "",
  grace_minutes: shift.grace_minutes,
  late_to_absent_hours: shift.late_to_absent_hours,
  target_hours_per_day: shift.target_hours_per_day,
  days: Object.fromEntries(
    DAYS_OF_WEEK.map((d) => [
      d.key,
      {
        is_working: shift[`${d.key}_is_working` as keyof DbShift] as boolean,
        start: shift[`${d.key}_start` as keyof DbShift] as string,
        end: shift[`${d.key}_end` as keyof DbShift] as string,
      },
    ]),
  ),
});

export const shiftStateToPayload = (state: ShiftEditState): Record<string, any> => {
  const payload: Record<string, any> = {
    name: state.name,
    description: state.description,
    grace_minutes: state.grace_minutes,
    late_to_absent_hours: state.late_to_absent_hours,
    target_hours_per_day: state.target_hours_per_day,
  };
  DAYS_OF_WEEK.forEach((d) => {
    const day = state.days[d.key];
    payload[`${d.key}_is_working`] = day.is_working;
    payload[`${d.key}_start`] = day.start;
    payload[`${d.key}_end`] = day.end;
  });
  return payload;
};

export const updateShiftDay = (
  state: ShiftEditState,
  dayKey: string,
  patch: Partial<ShiftDaySchedule>,
): ShiftEditState => ({
  ...state,
  days: { ...state.days, [dayKey]: { ...state.days[dayKey], ...patch } },
});

export const getWorkingDaysCount = (shift: DbShift): number => (
  DAYS_OF_WEEK.filter((d) => shift[`${d.key}_is_working` as keyof DbShift]).length
);

export const getWorkingDayLabels = (shift: DbShift): string[] => (
  DAYS_OF_WEEK.filter((d) => shift[`${d.key}_is_working` as keyof DbShift]).map((d) => d.label)
);
