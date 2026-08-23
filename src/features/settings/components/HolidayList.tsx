import { arabicSource } from "@/i18n/source";
import type { DbPublicHoliday } from "@/shared/hooks";
import HolidayListItem from "./HolidayListItem";

type THolidayListProps = {
  holidays: DbPublicHoliday[];
  onDelete: (holidayId: string) => void;
};

const HolidayList = ({ holidays, onDelete }: THolidayListProps) => {
  if (holidays.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-6">
        {arabicSource("settings.there_are_no_holidays_this_year")}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {holidays?.map((holiday) => (
        <HolidayListItem
          key={holiday.id}
          holiday={holiday}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default HolidayList;
