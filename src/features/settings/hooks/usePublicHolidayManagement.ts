import { useCallback, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { DbPublicHoliday } from "@/shared/hooks";
import { INITIAL_NEW_HOLIDAY } from "../constants/settings";
import type { NewHolidayForm } from "../types";

export const usePublicHolidayManagement = (
  holidays: DbPublicHoliday[],
  refetchHolidays: () => void,
  showToast: (message: string) => void,
) => {
  const [holidayYear, setHolidayYear] = useState(2026);
  const [showNewHolidayForm, setShowNewHolidayForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState<NewHolidayForm>({ ...INITIAL_NEW_HOLIDAY });

  const filteredHolidays = useMemo(() => (
    (holidays || []).filter((h) => new Date(h.date).getFullYear() === holidayYear)
  ), [holidays, holidayYear]);

  const updateNewHoliday = useCallback((patch: Partial<NewHolidayForm>) => {
    setNewHoliday((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetNewHolidayForm = useCallback(() => {
    setNewHoliday({ ...INITIAL_NEW_HOLIDAY });
    setShowNewHolidayForm(false);
  }, []);

  const addHoliday = useCallback(async () => {
    if (!newHoliday.name_ar || !newHoliday.date) {
      showToast(arabicSource("settings.please_fill_out_the_required_fields"));
      return;
    }
    try {
      await odooData.createHoliday({ name_ar: newHoliday.name_ar, date: newHoliday.date });
      refetchHolidays();
      resetNewHolidayForm();
      showToast(arabicSource("settings.holiday_added_successfully"));
    } catch {
      showToast(arabicSource("settings.error_adding_holiday"));
    }
  }, [newHoliday, refetchHolidays, resetNewHolidayForm, showToast]);

  const deleteHoliday = useCallback(async (holidayId: string) => {
    try {
      await odooData.deleteHoliday(holidayId);
      refetchHolidays();
      showToast(arabicSource("settings.vacation_has_been_successfully_deleted"));
    } catch {
      showToast(arabicSource("settings.error_deleting_holiday"));
    }
  }, [refetchHolidays, showToast]);

  return {
    holidayYear, setHolidayYear,
    showNewHolidayForm, setShowNewHolidayForm,
    newHoliday, updateNewHoliday, resetNewHolidayForm,
    filteredHolidays, addHoliday, deleteHoliday,
  };
};
