import { useState, useMemo } from "react";
import { ChevronRight, Search } from "lucide-react";
import {
  resolveLeaveEntitlement,
  type DbLeaveType,
  type DbLeaveBalance,
} from "@/shared/hooks";
import LoadingState from "@/shared/components/LoadingState";
import { arabicSource } from "@/i18n/source";
import {
  employeeNamePair,
  localizedEmployeeName,
  useIsArabicLanguage,
} from "@/i18n/useLocalizedName";
import { leaveInputClass as inputCls } from "../styles";
import LeaveBalanceCard from "./LeaveBalanceCard";
import EmployeeAccrualPanel from "./EmployeeAccrualPanel";
import EmployeeBalanceListItem from "./EmployeeBalanceListItem";

const BalancesTab = ({
  employees,
  leaveTypes,
  balances,
  policies,
  loading,
  year,
  selfOnly,
}: {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  policies: any[];
  loading: boolean;
  year: number;
  /** Agent viewing only their own leave — read balances without an employee_id. */
  selfOnly: boolean;
}) => {
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const isArabic = useIsArabicLanguage();

  const balancesByEmployeeId = useMemo(() => {
    const map = new Map<string, DbLeaveBalance[]>();
    for (const bal of balances) {
      const bucket = map.get(bal.employee_id);
      if (bucket) bucket.push(bal);
      else map.set(bal.employee_id, [bal]);
    }
    return map;
  }, [balances]);

  // Matches both name columns, not just the displayed one: the list now shows
  // English names in English mode, so an Arabic-only match would make a name
  // the user can see unsearchable.
  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (!normalizedSearch) return true;
      const { nameAr, nameEn } = employeeNamePair(e);
      return (
        nameAr.toLowerCase().includes(normalizedSearch) ||
        Boolean(nameEn?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(e.department?.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [employees, search]);

  const handleBackToList = (): void => {
    setSelectedEmp(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  if (loading) {
    return (
      <LoadingState
        wrapperClassName="flex items-center justify-center h-32"
        iconClassName="w-6 h-6 text-primary animate-spin"
      />
    );
  }

  if (selectedEmp) {
    const emp = employees.find((e) => e.id === selectedEmp);
    if (!emp) return null;
    const empBalances = balancesByEmployeeId.get(selectedEmp) || [];

    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          {arabicSource("leave.return_to_the_list_of_employees")}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary" style={{ fontSize: 18 }} data-i18n-ignore>
              {localizedEmployeeName(emp, isArabic).charAt(0)}
            </span>
          </div>
          <div data-i18n-ignore>
            <h3 className="text-foreground">{localizedEmployeeName(emp, isArabic)}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {emp.department} — {year}
            </p>
          </div>
        </div>

        <EmployeeAccrualPanel
          employeeId={selfOnly ? null : selectedEmp}
          leaveTypes={leaveTypes}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leaveTypes.map((lt, i) => {
            const bal = empBalances.find(
              (b) => b.leave_type === lt.name_ar || b.leave_type_id === lt.id,
            );
            const entitlement = resolveLeaveEntitlement(
              lt,
              policies,
              emp.department,
            );
            return (
              <LeaveBalanceCard
                key={lt.id}
                leaveType={lt}
                index={i}
                bal={bal}
                entitlement={entitlement}
              />
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
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={arabicSource("common.search_by_name_or_department")}
          className={`${inputCls} ps-10`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEmployees?.map((emp, i) => {
          const empBals = balancesByEmployeeId.get(emp.id) || [];
          const totalUsed = empBals.reduce((s, b) => s + b.used_days, 0);
          return (
            <EmployeeBalanceListItem
              key={emp.id}
              emp={emp}
              index={i}
              totalUsed={totalUsed}
              onSelect={setSelectedEmp}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BalancesTab;
