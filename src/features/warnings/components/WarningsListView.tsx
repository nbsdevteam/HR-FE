import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";
import { WarningTableRow } from "./WarningTableRow";

type WarningsListViewProps = {
  warnings: WarningWithEmployee[];
  typeColors: Record<string, string>;
  statusColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  warningsByEmployee: Record<string, number>;
  onSelectWarning: (warning: WarningWithEmployee) => void;
};

const TABLE_HEADERS = [
  arabicSource("common.employee"), arabicSource("common.section"), arabicSource("common.alarm_type"),
  arabicSource("common.the_reason"), arabicSource("common.date"), arabicSource("warnings.issued_by"),
  arabicSource("common.status"), arabicSource("common.procedures"),
];

export const WarningsListView = ({ warnings, typeColors, statusColors, typeSeverity, warningsByEmployee, onSelectWarning }: WarningsListViewProps) => (
  <motion.div
    key="list"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, delay: 0.7 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
  >
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/20 border-b border-border/20">
            {TABLE_HEADERS.map(h => (
              <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {warnings.length > 0 ? (
            warnings.map((warning, i) => (
              <WarningTableRow
                key={warning.id}
                warning={warning}
                index={i}
                typeColors={typeColors}
                statusColors={statusColors}
                typeSeverity={typeSeverity}
                duplicateCount={warningsByEmployee[warning.employee_id]}
                onSelect={() => onSelectWarning(warning)}
              />
            ))
          ) : (
            <tr>
              <td colSpan={8}><EmptyState icon={ShieldAlert} message={arabicSource("common.no_alarms")} /></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);
