import { useState, useMemo, useCallback, memo } from "react";
import { Wallet, TrendingUp, Calculator, Users } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import StatCard from "@/shared/components/StatCard";
import SearchInput from "@/shared/components/SearchInput";
import Pagination from "@/shared/components/Pagination";
import Select from "@/shared/components/Select";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import type { PayrollRow, PayrollStatus, PayrollTotals } from "@/shared/api/payrollTypes";
import {
  payrollCardClass as cardCls,
  payrollInputClass as inputCls,
} from "../styles";
import { formatIQD } from "../utils/payrollFormat";
import PayrollOverviewRow from "./PayrollOverviewRow";
import { sortByData } from "../data";

type PayrollSortKey = (typeof sortByData)[number]["key"];

const STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: arabicSource("payroll.status_draft"),
  generated: arabicSource("payroll.status_generated"),
};

type OverviewTabProps = {
  items: PayrollRow[];
  totals: PayrollTotals | null;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  departments?: Array<Record<string, unknown>>;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  statuses?: PayrollStatus[];
  status: PayrollStatus | "";
  onStatusChange: (value: string) => void;
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onViewPayslip: (id: string) => void;
};

const OverviewTab = ({
  items,
  totals,
  loading,
  error,
  search,
  onSearchChange,
  departments,
  departmentId,
  onDepartmentChange,
  statuses,
  status,
  onStatusChange,
  page,
  perPage,
  totalPages,
  total,
  onPageChange,
  onPerPageChange,
  onViewPayslip,
}: OverviewTabProps) => {
  const [paySortBy, setPaySortBy] = useState<PayrollSortKey>("employee_name");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");

  // Sorts only the current page — the server no longer hands the client a
  // full month to sort over (backend §4/§12).
  const sorted = useMemo(() => {
    const dir = paySortDir === "asc" ? 1 : -1;
    const list = [...items];
    list.sort((a, b) => {
      if (paySortBy === "employee_name")
        return dir * a.employee_name.localeCompare(b.employee_name, "ar");
      if (paySortBy === "department_name")
        return dir * a.department_name.localeCompare(b.department_name, "ar");
      return dir * ((a[paySortBy] as number) - (b[paySortBy] as number));
    });
    return list;
  }, [items, paySortBy, paySortDir]);

  const stats = useMemo(
    () => [
      {
        label: arabicSource("common.total_basic_salaries"),
        value: formatIQD(totals?.basic_salary ?? 0),
        icon: Wallet,
        color: "text-primary",
        accent: "from-primary/10",
      },
      {
        label: arabicSource("payroll.net_salaries"),
        value: formatIQD(totals?.net_salary ?? 0),
        icon: TrendingUp,
        color: "text-emerald-500",
        accent: "from-emerald-500/10",
      },
      {
        label: arabicSource("common.total_deductions"),
        value: formatIQD(totals?.total_deductions ?? 0),
        icon: Calculator,
        color: "text-destructive",
        accent: "from-destructive/10",
      },
      {
        label: arabicSource("common.number_of_employees"),
        value: String(totals?.employees ?? 0),
        icon: Users,
        color: "text-blue-500",
        accent: "from-blue-500/10",
      },
    ],
    [totals],
  );

  const departmentOptions = useMemo(
    () =>
      (departments ?? []).map((d) => ({
        value: String(d.id),
        label: String(d.name ?? ""),
      })),
    [departments],
  );

  const statusOptions = useMemo(
    () => (statuses ?? []).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
    [statuses],
  );

  const handleSort = useCallback(
    (key: PayrollSortKey): void => {
      toggleSort(key, paySortBy, paySortDir, setPaySortBy, setPaySortDir);
    },
    [paySortBy, paySortDir],
  );

  const renderRow = useCallback(
    (r: PayrollRow, i: number) => (
      <PayrollOverviewRow key={r.employee_id} row={r} index={i} onViewPayslip={onViewPayslip} />
    ),
    [onViewPayslip],
  );

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

      {error && (
        <p className="text-destructive" style={{ fontSize: 13 }} role="alert">
          {error}
        </p>
      )}

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={arabicSource("common.search_by_name_or_department")}
          wrapperClassName="relative flex-1 max-w-md"
          inputClassName={`${inputCls} ps-10`}
        />
        <Select
          value={departmentId}
          onChange={onDepartmentChange}
          options={departmentOptions}
          optionsAreData
          blankLabel={arabicSource("common.all")}
          placeholder={arabicSource("common.section")}
          className={inputCls}
          style={{ width: 180 }}
        />
        <Select
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
          blankLabel={arabicSource("common.all")}
          placeholder={arabicSource("common.status")}
          className={inputCls}
          style={{ width: 160 }}
        />
      </div>

      {/* Table */}
      <div className={cardCls}>
        <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <DataTable
            wrapperClassName={null}
            items={sorted}
            header={
              <SortableHeaderRow
                columns={sortByData}
                sortBy={paySortBy}
                sortDir={paySortDir}
                onSort={handleSort}
              />
            }
            renderRow={renderRow}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          loading={loading}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      </div>
    </div>
  );
};

export default memo(OverviewTab);
