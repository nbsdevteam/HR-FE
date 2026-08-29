import { arabicSource } from "@/i18n/source";

type TShiftScheduleTableRowProps = {
  label: string;
  isWorking: boolean;
  start: string;
  end: string;
};

const ShiftScheduleTableRow = ({
  label,
  isWorking,
  start,
  end,
}: TShiftScheduleTableRowProps) => (
  <tr className="border-b border-border/10">
    <td className="py-2 text-foreground">{label}</td>
    <td className="py-2">
      <span
        className={`text-xs px-2 py-1 rounded ${isWorking ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
      >
        {isWorking
          ? arabicSource("settings.business_day")
          : arabicSource("settings.day_off")}
      </span>
    </td>
    <td className="py-2 text-muted-foreground">
      {isWorking ? `${start} - ${end}` : "—"}
    </td>
  </tr>
);

export default ShiftScheduleTableRow;
