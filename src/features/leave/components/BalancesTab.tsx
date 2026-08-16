import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Loader2, Search } from "lucide-react";
import {
  empDisplayName, resolveLeaveEntitlement,
  type DbLeaveType, type DbLeaveBalance,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { leaveInputClass as inputCls } from "../styles";

export const BalancesTab = function BalancesTab({
  employees, leaveTypes, balances, policies, loading, year,
}: {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  policies: any[];
  loading: boolean;
  year: number;
}) {
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredEmployees = employees.filter(e =>
    !search || empDisplayName(e).includes(search) || e.department?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (selectedEmp) {
    const emp = employees.find(e => e.id === selectedEmp);
    if (!emp) return null;
    const empBalances = balances.filter(b => b.employee_id === selectedEmp);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedEmp(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          {arabicSource("leave.return_to_the_list_of_employees")}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary" style={{ fontSize: 18 }}>{empDisplayName(emp).charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-foreground">{empDisplayName(emp)}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>{emp.department} — {year}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leaveTypes.map((lt, i) => {
            const bal = empBalances.find(b => b.leave_type === lt.name_ar || b.leave_type_id === lt.id);
            const entitlement = resolveLeaveEntitlement(lt, policies, emp.department);
            const totalDays = bal?.total_days ?? entitlement;
            const usedDays = bal?.used_days ?? 0;
            const carryover = bal?.carryover_days ?? 0;
            const remaining = totalDays + carryover - usedDays;
            const pct = totalDays > 0 ? Math.min(100, (usedDays / (totalDays + carryover)) * 100) : 0;

            return (
              <motion.div
                key={lt.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-foreground" style={{ fontSize: 14 }}>{lt.name_ar}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gradient-gold" style={{ fontSize: 28 }}>{remaining}</span>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>/ {totalDays + carryover} {arabicSource("common.days_2")}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted/30">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: lt.color }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.user")} {usedDays}</p>
                  {carryover > 0 && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("leave.relay")} {carryover}</p>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {lt.allow_half_day && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" style={{ fontSize: 9 }}>{arabicSource("common.half_a_day")}</span>}
                  {lt.is_encashable && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" style={{ fontSize: 9 }}>{arabicSource("common.exchangeable")}</span>}
                  {lt.is_carryover_allowed && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" style={{ fontSize: 9 }}>{arabicSource("common.relay")}</span>}
                  {!lt.is_paid && <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20" style={{ fontSize: 9 }}>{arabicSource("common.without_salary")}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={arabicSource("common.search_by_name_or_department")}
          className={`${inputCls} ps-10`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEmployees.map((emp, i) => {
          const empBals = balances.filter(b => b.employee_id === emp.id);
          const totalUsed = empBals.reduce((s, b) => s + b.used_days, 0);
          return (
            <motion.button
              key={emp.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedEmp(emp.id)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer text-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary" style={{ fontSize: 14 }}>{empDisplayName(emp).charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{empDisplayName(emp)}</p>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{emp.department}</p>
              </div>
              <div className="text-end">
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.user")} {totalUsed} {arabicSource("common.days_2")}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════ Permissions Tab ══════════════════════════

