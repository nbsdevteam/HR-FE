import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { LeaveRecord } from "../types";
import EmployeeLeaveCard from "./EmployeeLeaveCard";

type EmployeeLeavesTabProps = {
  leaves: LeaveRecord[];
};

const EmployeeLeavesTab = ({ leaves }: EmployeeLeavesTabProps) => (
  <motion.div
    key="leaves"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
    className="px-6 py-5 space-y-4"
  >
    <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.vacation_record")}</p>

    {leaves.length > 0 ? (
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
                {Math.max(0, 30 - leaves.filter(l => l.status === arabicSource("common.agreed")).reduce((s, l) => s + l.days, 0))}
              </span>
              <span className="text-muted-foreground ms-1.5" style={{ fontSize: 13 }}>{arabicSource("common.days_left")}</span>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CalendarCheck className="w-10 h-10 mb-3 opacity-30" />
        <p style={{ fontSize: 14 }}>{arabicSource("shared.no_vacations_recorded")}</p>
      </div>
    )}
  </motion.div>
);

export default EmployeeLeavesTab;
