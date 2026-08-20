import { motion } from "motion/react";
import { Plus, PartyPopper } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { usePublicHolidays } from "@/shared/hooks";
import { cardCls } from "../styles";
import { HOLIDAY_YEAR_OPTIONS } from "../constants/settings";
import { usePublicHolidayManagement } from "../hooks/usePublicHolidayManagement";
import HolidayList from "./HolidayList";
import NewHolidayForm from "./NewHolidayForm";

type TPublicHolidaysCardProps = {
  showToast: (message: string) => void;
};

const PublicHolidaysCard = ({ showToast }: TPublicHolidaysCardProps) => {
  const {
    holidays,
    loading: holidaysLoading,
    refetch: refetchHolidays,
  } = usePublicHolidays();
  const {
    holidayYear,
    setHolidayYear,
    showNewHolidayForm,
    setShowNewHolidayForm,
    newHoliday,
    updateNewHoliday,
    resetNewHolidayForm,
    filteredHolidays,
    addHoliday,
    deleteHoliday,
  } = usePublicHolidayManagement(holidays, refetchHolidays, showToast);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`${cardCls} lg:col-span-2`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <PartyPopper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">
              {arabicSource("settings.public_holidays")}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {arabicSource(
                "settings.holidays_are_automatically_excluded_from_absence_and_tardiness_c",
              )}
            </p>
          </div>
        </div>
      </div>

      {holidaysLoading ? (
        <div className="text-muted-foreground text-center py-6">
          {arabicSource("common.loading")}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-foreground text-sm">
                {arabicSource("settings.year")}
              </label>
              <select
                value={holidayYear}
                onChange={(e) => setHolidayYear(parseInt(e.target.value))}
                className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              >
                {HOLIDAY_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            {!showNewHolidayForm && (
              <button
                onClick={() => setShowNewHolidayForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {arabicSource("settings.add_holiday")}
              </button>
            )}
          </div>

          {showNewHolidayForm && (
            <NewHolidayForm
              form={newHoliday}
              onFieldChange={updateNewHoliday}
              onSave={addHoliday}
              onCancel={resetNewHolidayForm}
            />
          )}

          <HolidayList holidays={filteredHolidays} onDelete={deleteHoliday} />
        </div>
      )}
    </motion.div>
  );
};

export default PublicHolidaysCard;
