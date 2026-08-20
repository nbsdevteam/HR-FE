import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { formatDate } from "@/i18n/format";
import type { DbPublicHoliday } from "@/shared/hooks";

type THolidayListItemProps = {
  holiday: DbPublicHoliday;
  onDelete: () => void;
};

const HolidayListItem = ({ holiday, onDelete }: THolidayListItemProps) => (
  <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
    <div className="flex-1">
      <p className="text-foreground text-sm">{holiday.name_ar}</p>
      <p className="text-muted-foreground text-xs mt-1">
        {formatDate(holiday.date)}
        {holiday.is_recurring &&
          " " + arabicSource("settings.annual_frequency")}
      </p>
    </div>
    <button
      onClick={onDelete}
      className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded text-xs transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      {arabicSource("common.delete")}
    </button>
  </div>
);

export default HolidayListItem;
