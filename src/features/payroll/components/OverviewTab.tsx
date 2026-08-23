import { useState, useMemo, memo } from "react";
import { Wallet, TrendingUp, Calculator, Users } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import StatCard from "@/shared/components/StatCard";
import CustomBarChart from "@/shared/components/custom-bar-chart";
import SearchInput from "@/shared/components/SearchInput";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import {
  payrollCardClass as cardCls,
  payrollInputClass as inputCls,
} from "../styles";
import { formatIQD } from "../utils/payrollFormat";
import PayrollOverviewRow from "./PayrollOverviewRow";
import { sortByData } from "../data";

const OverviewTab = ({
  payrollData,
  totalBasic,
  totalNet,
  totalDeductions,
  totalEmployees,
  onViewPayslip,
}: {
  payrollData: any[];
  totalBasic: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployees: number;
  onViewPayslip: (id: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [paySortBy, setPaySortBy] = useState<
    | "name"
    | "department"
    | "basicSalary"
    | "daysWorked"
    | "totalHours"
    | "overtime"
    | "shortfall"
    | "absences"
    | "netSalary"
  >("name");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const list = payrollData.filter(
      (r: any) =>
        !search || r.name.includes(search) || r.department.includes(search),
    );
    const dir = paySortDir === "asc" ? 1 : -1;
    list.sort((a: any, b: any) => {
      if (paySortBy === "name")
        return dir * (a.name || "").localeCompare(b.name || "", "ar");
      if (paySortBy === "department")
        return (
          dir * (a.department || "").localeCompare(b.department || "", "ar")
        );
      return dir * ((a[paySortBy] || 0) - (b[paySortBy] || 0));
    });
    return list;
  }, [payrollData, search, paySortBy, paySortDir]);

  const stats = useMemo(
    () => [
      {
        label: arabicSource("common.total_basic_salaries"),
        value: formatIQD(totalBasic),
        icon: Wallet,
        color: "text-primary",
        accent: "from-primary/10",
      },
      {
        label: arabicSource("payroll.net_salaries"),
        value: formatIQD(totalNet),
        icon: TrendingUp,
        color: "text-emerald-500",
        accent: "from-emerald-500/10",
      },
      {
        label: arabicSource("common.total_deductions"),
        value: formatIQD(Math.abs(totalDeductions)),
        icon: Calculator,
        color: "text-destructive",
        accent: "from-destructive/10",
      },
      {
        label: arabicSource("common.number_of_employees"),
        value: String(totalEmployees),
        icon: Users,
        color: "text-blue-500",
        accent: "from-blue-500/10",
      },
    ],
    [totalBasic, totalNet, totalDeductions, totalEmployees],
  );

  const departmentPayroll = useMemo(() => {
    const map: Record<string, number> = {};
    payrollData.forEach((r: any) => {
      map[r.department] = (map[r.department] || 0) + r.netSalary;
    });
    return Object.entries(map).map(([name, total]) => ({
      label: name,
      value: Math.round(total / 1000),
    }));
  }, [payrollData]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            index={i}
            decoration="blob"
            decorationClassName={stat.accent}
            hoverLift
            valueSize={22}
            valueClassName={stat.color}
            valueMarginClassName="mt-2"
            labelSize={12}
            iconClassName={`w-5 h-5 ${stat.color}`}
            dir="ltr"
          />
        ))}
      </div>

      {/* Chart */}
      {departmentPayroll.length > 0 && (
        <div className={`${cardCls} p-6`}>
          <h3 className="text-foreground mb-3" style={{ fontSize: 15 }}>
            {arabicSource("payroll.net_salaries_by_department_thousand_iqd")}
          </h3>
          <CustomBarChart
            data={departmentPayroll}
            barLabel={arabicSource("common.amount")}
            height={180}
          />
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={arabicSource("common.search_by_name_or_department")}
          wrapperClassName="relative flex-1 max-w-md"
          inputClassName={`${inputCls} ps-10`}
        />
      </div>

      {/* Table */}
      <DataTable
        wrapperClassName={cardCls}
        items={filtered}
        header={
          <SortableHeaderRow
            columns={sortByData}
            sortBy={paySortBy}
            sortDir={paySortDir}
            onSort={(key) =>
              toggleSort(
                key,
                paySortBy,
                paySortDir,
                setPaySortBy,
                setPaySortDir,
              )
            }
          />
        }
        renderRow={(r: any, i: number) => (
          <PayrollOverviewRow
            key={r.empId}
            row={r}
            index={i}
            onViewPayslip={onViewPayslip}
          />
        )}
        emptyRow={
          <tr>
            <td
              colSpan={9}
              className="px-4 py-12 text-center text-muted-foreground"
            >
              {arabicSource(
                "payroll.there_are_no_payroll_records_for_this_month",
              )}
            </td>
          </tr>
        }
      />
    </div>
  );
};

export default memo(OverviewTab);
