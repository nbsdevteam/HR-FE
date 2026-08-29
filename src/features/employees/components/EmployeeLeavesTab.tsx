import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { LoadingState } from "@/shared/components";
import type { LeaveRecord } from "../types";
import EmployeeLeaveCard from "./EmployeeLeaveCard";
import TabShellEmptyState from "./shared/TabShellEmptyState";

type EmployeeLeavesTabProps = {
  leaves: LeaveRecord[];
  loading: boolean;
  error: string | null;
};

const EmployeeLeavesTab = ({ leaves, loading, error }: EmployeeLeavesTabProps) => (
  <motion.div
    key="leaves"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
    className="px-6 py-5 space-y-4"
  >
    <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.vacation_record")}</p>

    {error && (
      <div
        className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
        style={{ fontSize: 13 }}
      >
        {arabicSource("shared.error_saving")} {error}
      </div>
    )}

    {loading ? (
      <LoadingState variant="compact" message={arabicSource("common.loading")} />
    ) : leaves.length > 0 ? (
      <>
        {leaves.map((leave) => (
          <EmployeeLeaveCard key={leave.id} leave={leave} />
        ))}

        {/* Leave Summary */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-2">
          <p className="text-muted-foreground mb-3" style={{ fontSize: 13 }}>{arabicSource("common.vacation_summary")}</p>
          <div className="flex items-center gap-8">
            <div>
              <span className="text-foreground" style={{ fontSize: 22 }}>
                {leaves.reduce((s, l) => s + l.days, 0)}
              </span>
              <span className="text-muted-foreground ms-1.5" style={{ fontSize: 13 }}>{arabicSource("shared.user_days")}</span>
            </div>
            <div>
              <span className="text-primary" style={{ fontSize: 22 }}>
                {Math.max(0, 30 - leaves.filter(l => l.status === arabicSource("common.accepted")).reduce((s, l) => s + l.days, 0))}
              </span>
              <span className="text-muted-foreground ms-1.5" style={{ fontSize: 13 }}>{arabicSource("common.days_left")}</span>
            </div>
          </div>
        </div>
      </>
    ) : (
      <TabShellEmptyState icon={CalendarCheck} message={arabicSource("shared.no_vacations_recorded")} />
    )}
  </motion.div>
);

export default EmployeeLeavesTab;
