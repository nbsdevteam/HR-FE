import { useCallback } from "react";
import { Plus, PartyPopper } from "lucide-react";
import { Button, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { HOLIDAY_YEAR_OPTIONS } from "../constants/settings";
import { usePublicHolidayManagement } from "../hooks/usePublicHolidayManagement";
import HolidayList from "./HolidayList";
import NewHolidayForm from "./NewHolidayForm";
import SettingsSectionCard from "./SettingsSectionCard";

type TPublicHolidaysCardProps = {
  showToast: (message: string) => void;
};

// Module scope so the Select does not receive a freshly built array each render.
const HOLIDAY_YEAR_SELECT_OPTIONS = HOLIDAY_YEAR_OPTIONS.map((year) => String(year));

const PublicHolidaysCard = ({ showToast }: TPublicHolidaysCardProps) => {
  const {
    holidays,
    loading: holidaysLoading,
    refetch: refetchHolidays,
  } = useSettingsBootstrap();
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

  const handleHolidayYearChange = useCallback(
    (value: string): void => {
      setHolidayYear(parseInt(value));
    },
    [setHolidayYear],
  );

  const handleShowNewHolidayForm = useCallback((): void => {
    setShowNewHolidayForm(true);
  }, [setShowNewHolidayForm]);

  return (
    <SettingsSectionCard
      icon={PartyPopper}
      title={arabicSource("settings.public_holidays")}
      description={arabicSource(
        "settings.holidays_are_automatically_excluded_from_absence_and_tardiness_c",
      )}
      delay={0.4}
    >
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
              <Select
                value={String(holidayYear)}
                onChange={handleHolidayYearChange}
                options={HOLIDAY_YEAR_SELECT_OPTIONS}
                className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {!showNewHolidayForm && (
              <Button
                icon={Plus}
                onClick={handleShowNewHolidayForm}
                className="cursor-pointer"
              >
                {arabicSource("settings.add_holiday")}
              </Button>
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
    </SettingsSectionCard>
  );
};

export default PublicHolidaysCard;
