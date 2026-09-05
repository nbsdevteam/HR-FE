import { useCallback, useEffect, useMemo, useState } from "react";
import { useEmployees, useOdooMutation } from "@/shared/hooks";
import { generatePayslipsServer } from "@/shared/api/payroll";
import type { PayrollStatus, PayslipGenerateRequest } from "@/shared/api/payrollTypes";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { errorMessage } from "../utils/errorMessage";
import { usePayrollMetadata } from "./usePayrollMetadata";
import { usePayrollListPaged } from "./usePayrollListPaged";
import type { PayrollTabId } from "../types";

export const usePayrollPage = () => {
  const [activeTab, setActiveTab] = useState<PayrollTabId>("overview");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<PayrollStatus | "">("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [payslipsSaved, setPayslipsSaved] = useState(false);

  const { settings: appSettings } = useAppSettings();
  const { metadata, loading: metadataLoading } = usePayrollMetadata();
  // Full roster kept only for the (out-of-scope) Upload tab — the Salary list
  // itself never holds more than one page of employees.
  const { employees } = useEmployees();
  // Invalidates both payroll queries so a generated batch shows up without a
  // manual refetch — usePayrollListPaged's totals query is keyed separately
  // from its page query (see that hook), and both start with these prefixes.
  const generatePayslipsMutation = useOdooMutation(
    (payload: PayslipGenerateRequest) => generatePayslipsServer(payload),
    ["payrollList", "payrollTotals"],
  );
  const list = usePayrollListPaged({
    month: selectedMonth,
    search,
    departmentId: departmentId || null,
    employeeId: null,
    status: status || null,
  });

  const availableMonths = metadata?.available_months ?? [];
  const initialLoading = metadataLoading && !metadata;

  const displayMonth = useCallback(
    (m: string) => formatMonthYear(m, appSettings.monthFormat),
    [appSettings.monthFormat],
  );

  const handleSearchChange = useCallback((value: string): void => {
    setSearch(value);
  }, []);

  const handleDepartmentChange = useCallback((value: string): void => {
    setDepartmentId(value);
  }, []);

  const handleStatusChange = useCallback((value: string): void => {
    setStatus(value as PayrollStatus | "");
  }, []);

  const handleMonthChange = useCallback((month: string): void => {
    setSelectedMonth(month);
  }, []);

  const handleGeneratePayslips = useCallback(async (): Promise<void> => {
    if (!selectedMonth) return;
    try {
      await generatePayslipsMutation.mutateAsync({ month: selectedMonth, replace_month: true });
      setPayslipsSaved(true);
      setTimeout(() => setPayslipsSaved(false), 3000);
    } catch (e: unknown) {
      const message = errorMessage(e);
      console.error("Failed to generate payslips:", message);
      localizedAlert(`${arabicSource("payroll.error_saving_statements")} ${message}`);
    }
  }, [selectedMonth, generatePayslipsMutation]);

  useEffect(() => {
    if (selectedMonth || !metadata) return;
    setSelectedMonth(metadata.current_month);
  }, [metadata, selectedMonth]);

  return useMemo(
    () => ({
      activeTab,
      appSettings,
      availableMonths,
      departmentId,
      displayMonth,
      employees,
      handleDepartmentChange,
      handleGeneratePayslips,
      handleMonthChange,
      handleSearchChange,
      handleStatusChange,
      initialLoading,
      items: list.items,
      listError: list.listError,
      listLoading: list.listLoading,
      metadata,
      onPageChange: list.onPageChange,
      onPerPageChange: list.onPerPageChange,
      page: list.page,
      payslipsSaved,
      perPage: list.perPage,
      refetchList: list.refetchList,
      savingPayslips: generatePayslipsMutation.isPending,
      search,
      selectedEmpId,
      selectedMonth,
      setActiveTab,
      setSelectedEmpId,
      status,
      total: list.total,
      totalPages: list.totalPages,
      totals: list.totals,
      totalsLoading: list.totalsLoading,
    }),
    [
      activeTab, appSettings, availableMonths, departmentId, displayMonth, employees,
      generatePayslipsMutation.isPending, handleDepartmentChange, handleGeneratePayslips,
      handleMonthChange, handleSearchChange, handleStatusChange, initialLoading, list,
      metadata, payslipsSaved, search, selectedEmpId, selectedMonth, status,
    ],
  );
};
