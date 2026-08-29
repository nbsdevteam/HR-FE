import { memo } from "react";
import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";
import WarningTableRow from "./WarningTableRow";

type TWarningsListViewProps = {
  warnings: WarningWithEmployee[];
  typeColors: Record<string, string>;
  statusColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  warningsByEmployee: Record<string, number>;
  onSelectWarning: (warning: WarningWithEmployee) => void;
};

const TABLE_HEADERS = [
  arabicSource("common.employee"),
  arabicSource("common.section"),
  arabicSource("common.alarm_type"),
  arabicSource("common.the_reason"),
  arabicSource("common.date"),
  arabicSource("warnings.issued_by"),
  arabicSource("common.status"),
  arabicSource("common.procedures"),
];

const WarningsListView = ({
  warnings,
  typeColors,
  statusColors,
  typeSeverity,
  warningsByEmployee,
  onSelectWarning,
}: TWarningsListViewProps) => (
  <motion.div
    key="list"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, delay: 0.7 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
  >
    <DataTable
      wrapperClassName={null}
      items={warnings}
      header={<TableHeaderRow headings={TABLE_HEADERS} />}
      renderRow={(warning, i) => (
        <WarningTableRow
          key={warning.id}
          warning={warning}
          index={i}
          typeColors={typeColors}
          statusColors={statusColors}
          typeSeverity={typeSeverity}
          duplicateCount={warningsByEmployee[warning.employee_id]}
          onSelect={onSelectWarning}
        />
      )}
      emptyRow={
        <tr>
          <td colSpan={8}>
            <EmptyState
              icon={ShieldAlert}
              message={arabicSource("common.no_alarms")}
            />
          </td>
        </tr>
      }
    />
  </motion.div>
);

export default memo(WarningsListView);
