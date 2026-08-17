import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Wallet, TrendingUp, Calculator, Users,
  ArrowUpRight, ArrowDownRight,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/features/payroll";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls, payrollInputClass as inputCls } from "../styles";
import { formatIQD } from "../utils/payrollFormat";

const OverviewTab = ({
  payrollData,
  totalBasic,
  totalNet,
  totalDeductions,
  totalEmployees,
  selectedMonth,
  onViewPayslip,
}: {
  payrollData: any[];
  totalBasic: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployees: number;
  selectedMonth: string;
  onViewPayslip: (id: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [paySortBy, setPaySortBy] = useState<"name" | "department" | "basicSalary" | "daysWorked" | "totalHours" | "overtime" | "shortfall" | "absences" | "netSalary">("name");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const list = payrollData.filter((r: any) =>
      !search || r.name.includes(search) || r.department.includes(search)
    );
    const dir = paySortDir === "asc" ? 1 : -1;
    list.sort((a: any, b: any) => {
      if (paySortBy === "name") return dir * (a.name || "").localeCompare(b.name || "", "ar");
      if (paySortBy === "department") return dir * (a.department || "").localeCompare(b.department || "", "ar");
      return dir * ((a[paySortBy] || 0) - (b[paySortBy] || 0));
    });
    return list;
  }, [payrollData, search, paySortBy, paySortDir]);

  const stats = [
    { label: arabicSource("common.total_basic_salaries"), value: formatIQD(totalBasic), icon: Wallet, color: "text-primary", accent: "from-primary/10" },
    { label: arabicSource("payroll.net_salaries"), value: formatIQD(totalNet), icon: TrendingUp, color: "text-emerald-500", accent: "from-emerald-500/10" },
    { label: arabicSource("common.total_deductions"), value: formatIQD(Math.abs(totalDeductions)), icon: Calculator, color: "text-destructive", accent: "from-destructive/10" },
    { label: arabicSource("common.number_of_employees"), value: String(totalEmployees), icon: Users, color: "text-blue-500", accent: "from-blue-500/10" },
  ];

  const departmentPayroll = useMemo(() => {
    const map: Record<string, number> = {};
    payrollData.forEach((r: any) => { map[r.department] = (map[r.department] || 0) + r.netSalary; });
    return Object.entries(map).map(([name, total]) => ({
      label: name,
      value: Math.round(total / 1000),
    }));
  }, [payrollData]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className={`absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl ${stat.accent} to-transparent rounded-bl-full`} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                  <span className={`block mt-2 ${stat.color}`} style={{ fontSize: 22 }} dir="ltr">{stat.value}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {departmentPayroll.length > 0 && (
        <div className={`${cardCls} p-6`}>
          <h3 className="text-foreground mb-3" style={{ fontSize: 15 }}>{arabicSource("payroll.net_salaries_by_department_thousand_iqd")}</h3>
          <CustomBarChart data={departmentPayroll} barLabel={arabicSource("common.amount")} height={180} />
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={arabicSource("common.search_by_name_or_department")}
            className={`${inputCls} ps-10`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <SortableHeaderRow
                columns={[
                  { label: arabicSource("common.employee"), key: "name" },
                  { label: arabicSource("common.section"), key: "department" },
                  { label: arabicSource("common.basic_salary"), key: "basicSalary" },
                  { label: arabicSource("common.working_days"), key: "daysWorked" },
                  { label: arabicSource("common.working_hours"), key: "totalHours" },
                  { label: arabicSource("common.overtime"), key: "overtime" },
                  { label: arabicSource("common.shortage"), key: "shortfall" },
                  { label: arabicSource("common.absence"), key: "absences" },
                  { label: arabicSource("common.net_salary"), key: "netSalary" },
                ]}
                sortBy={paySortBy}
                sortDir={paySortDir}
                onSort={(key) => toggleSort(key, paySortBy, paySortDir, setPaySortBy, setPaySortDir)}
              />
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((r: any, i: number) => (
                <motion.tr
                  key={r.empId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer"
                  onClick={() => onViewPayslip(r.empId)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary" style={{ fontSize: 12 }}>{r.name.charAt(0)}</span>
                      </div>
                      <span className="text-foreground whitespace-nowrap">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" style={{ fontSize: 13 }}>{r.department}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
                    {formatCurrency(r.basicSalary, r.currency)}
                  </td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.daysWorked}</td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.totalHours.toFixed(1)}</td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.overtime > 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {r.overtime.toFixed(1)}h
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.shortfall > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {r.shortfall.toFixed(1)}h
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 13 }}>
                    {r.absences > 0 ? (
                      <span className="text-destructive">{r.absences} {arabicSource("common.days_2")}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
                    <span className="text-gradient-gold">{formatCurrency(r.netSalary, r.currency)}</span>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    {arabicSource("payroll.there_are_no_payroll_records_for_this_month")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

// Upload tab
