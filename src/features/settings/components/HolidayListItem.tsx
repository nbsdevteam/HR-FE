import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { formatDate } from "@/i18n/format";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import { Button } from "@/shared/components";
import type { DbPublicHoliday } from "@/shared/hooks";

type THolidayListItemProps = {
  holiday: DbPublicHoliday;
  onDelete: (holidayId: string) => void;
};

const HolidayListItem = ({ holiday, onDelete }: THolidayListItemProps) => {
  const { primary } = useLocalizedName(holiday.name_ar, holiday.name_en);

  const handleDelete = useCallback((): void => {
    onDelete(holiday.id);
  }, [onDelete, holiday.id]);

  return (
    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
      <div className="flex-1">
        <p className="text-foreground text-sm" data-i18n-ignore>{primary}</p>
        <p className="text-muted-foreground text-xs mt-1">
          {formatDate(holiday.date)}
          {holiday.is_recurring &&
            " " + arabicSource("settings.annual_frequency")}
        </p>
      </div>
      <Button
        variant="unstyled"
        size="unstyled"
        rounded="rounded"
        onClick={handleDelete}
        className="gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 text-xs"
      >
        <Trash2 className="w-4 h-4" />
        {arabicSource("common.delete")}
      </Button>
    </div>
  );
};

export default memo(HolidayListItem);
