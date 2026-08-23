import { arabicSource } from "@/i18n/source";
import DataTable from "@/shared/components/DataTable";
import type { DbShift } from "@/shared/hooks";
import { DAYS_OF_WEEK } from "../constants/settings";
import ShiftScheduleTableRow from "./ShiftScheduleTableRow";

type TShiftScheduleTableProps = {
  shift: DbShift;
};

const ShiftScheduleTable = ({ shift }: TShiftScheduleTableProps) => (
  <DataTable
    wrapperClassName={null}
    tableStyle={{ fontSize: 12 }}
    items={DAYS_OF_WEEK}
    header={
      <tr className="border-b border-border/20">
        <th className="text-start text-muted-foreground py-2">
          {arabicSource("common.today")}
        </th>
        <th className="text-start text-muted-foreground py-2">
          {arabicSource("common.status")}
        </th>
        <th className="text-start text-muted-foreground py-2">
          {arabicSource("common.time")}
        </th>
      </tr>
    }
    renderRow={(d) => (
      <ShiftScheduleTableRow
        key={d.key}
        label={d.label}
        isWorking={shift[`${d.key}_is_working` as keyof DbShift] as boolean}
        start={shift[`${d.key}_start` as keyof DbShift] as string}
        end={shift[`${d.key}_end` as keyof DbShift] as string}
      />
    )}
  />
);

export default ShiftScheduleTable;
