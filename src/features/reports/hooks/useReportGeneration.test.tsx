import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { changeLanguage } from "@/i18n";
import type { HrReportGenerateResult } from "@/shared/api/reporting";
import type { DbReportTemplate } from "@/shared/hooks";

const api = vi.hoisted(() => ({ generateHrReport: vi.fn(), createReportHistory: vi.fn(), logAudit: vi.fn() }));
vi.mock("@/shared/api/reporting", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/reporting")>()),
  generateHrReport: api.generateHrReport,
}));
vi.mock("@/shared/api/odooData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/odooData")>()),
  createReportHistory: api.createReportHistory,
}));
vi.mock("@/shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/hooks")>()),
  logAudit: api.logAudit,
}));

const { useReportGeneration } = await import("./useReportGeneration");

const payroll = {
  id: "7", code: "payroll_monthly", name_ar: "الرواتب الشهرية", name_en: "Monthly Payroll",
  columns: [{ key: "employee_name", label: "Employee" }],
} as DbReportTemplate;
// No browser generator and no backend code: built in the browser as the "no data" row.
const custom = { id: "9", code: "admin_custom", name_ar: "تقرير مخصص", name_en: "Custom", columns: [{ key: "info", label: "Info" }] } as DbReportTemplate;

const report = (employeeName: string): HrReportGenerateResult => ({
  code: "payroll_monthly",
  template: { id: 7, code: "payroll_monthly", name_ar: "الرواتب الشهرية", name_en: "Monthly Payroll", category: "payroll" },
  columns: [{ key: "employee_name", label: employeeName === "TEST HR Demo" ? "Employee" : "الموظف" }],
  rows: [{ employee_name: employeeName }],
  row_count: 1,
  filters_used: {},
  available_fields: [],
  default_fields: [],
  selected_fields: ["employee_name"],
  selected_employee_ids: [5508],
  history: null,
  timezone: "Asia/Baghdad",
  generated_at: "2026-11-24 10:00:00",
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => { resolve = settle; });
  return { promise, resolve };
};

/** The payload the n-th `/api/hr/reports/generate` call sent (TanStack may pass the mutation a second, context argument). */
const sent = (n: number) => api.generateHrReport.mock.calls[n]?.[0] as Record<string, unknown>;

const setUp = (selectedTemplate: DbReportTemplate | null) => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useReportGeneration({
    selectedTemplate,
    attendanceRecords: [],
    monthlyRecords: [],
    leaveRequests: [],
    leaveTypes: [],
    leaveBalances: [],
    employees: [],
    contracts: [],
    contractTypes: [],
    empDocuments: [],
    documentTypes: [],
    empMap: {},
    empDeptMap: {},
    departments: [],
    dateFrom: "2026-11-01",
    dateTo: "2026-11-30",
    filterDept: "",
    selectedEmployeeIds: ["5508"],
    selectedFieldKeys: ["employee_name"],
    refetchHistory: vi.fn(),
  }), { wrapper }).result;
};

beforeEach(async () => {
  api.generateHrReport.mockReset();
  api.createReportHistory.mockReset();
  api.logAudit.mockReset();
  api.logAudit.mockResolvedValue(undefined);
  await changeLanguage("en");
});
afterEach(async () => {
  await changeLanguage("ar");
});

describe("an open HR report follows the language switch", () => {
  it("runs the same report again in Arabic, without a history row, and shows that response", async () => {
    api.generateHrReport
      .mockResolvedValueOnce(report("TEST HR Demo"))
      .mockResolvedValueOnce(report("تجربة الموارد البشرية"));
    const result = setUp(payroll);

    await act(() => result.current.generateReport(payroll));
    expect(result.current.generatedData).toEqual([{ employee_name: "TEST HR Demo" }]);

    await act(() => changeLanguage("ar"));
    await waitFor(() => expect(result.current.generatedData).toEqual([{ employee_name: "تجربة الموارد البشرية" }]));
    expect(result.current.generatedColumns).toEqual([{ key: "employee_name", label: "الموظف" }]);
    expect(result.current.generating).toBe(false);

    expect(api.generateHrReport).toHaveBeenCalledTimes(2);
    expect(sent(0)).toMatchObject({ lang: "en", create_history: true });
    // Same report, filters and fields; only `lang` and the history flag change.
    expect(sent(1)).toEqual({ ...sent(0), lang: "ar", create_history: false });
    expect(sent(1).filters).not.toHaveProperty("lang");
  });

  it("logs the export once: the first generate does, the language re-run does not", async () => {
    api.generateHrReport
      .mockResolvedValueOnce(report("TEST HR Demo"))
      .mockResolvedValueOnce(report("تجربة الموارد البشرية"));
    const result = setUp(payroll);

    await act(() => result.current.generateReport(payroll));
    expect(api.logAudit).toHaveBeenCalledTimes(1);
    expect(api.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "export", entity_type: "report", entity_id: "7" }));

    await act(() => changeLanguage("ar"));
    await waitFor(() => expect(result.current.generatedData).toEqual([{ employee_name: "تجربة الموارد البشرية" }]));
    expect(api.generateHrReport).toHaveBeenCalledTimes(2);
    expect(api.logAudit).toHaveBeenCalledTimes(1);
  });

  it("makes no call when no report is shown", async () => {
    const result = setUp(payroll);
    await act(() => changeLanguage("ar"));
    expect(api.generateHrReport).not.toHaveBeenCalled();
    expect(result.current.generatedData).toBeNull();
  });

  it("makes no call on mount", () => {
    setUp(payroll);
    setUp(null);
    expect(api.generateHrReport).not.toHaveBeenCalled();
    expect(api.logAudit).not.toHaveBeenCalled();
  });

  it("makes no call while an error is shown", async () => {
    api.generateHrReport.mockImplementationOnce(() => Promise.reject(new Error("server down")));
    const result = setUp(payroll);
    await act(() => result.current.generateReport(payroll));
    expect(result.current.generateError).toBe("server down");

    await act(() => changeLanguage("ar"));
    expect(api.generateHrReport).toHaveBeenCalledTimes(1);
  });

  it("makes no call once the viewer is closed", async () => {
    api.generateHrReport.mockResolvedValueOnce(report("TEST HR Demo"));
    const result = setUp(null);
    await act(() => result.current.generateReport(payroll));

    await act(() => changeLanguage("ar"));
    expect(api.generateHrReport).toHaveBeenCalledTimes(1);
  });

  it("shows only the newest request's rows when the older one answers last", async () => {
    const english = deferred<HrReportGenerateResult>();
    const arabic = deferred<HrReportGenerateResult>();
    api.generateHrReport.mockReturnValueOnce(english.promise).mockReturnValueOnce(arabic.promise);
    const result = setUp(payroll);

    let firstRun: Promise<void> = Promise.resolve();
    act(() => { firstRun = result.current.generateReport(payroll); });
    await act(() => changeLanguage("ar"));
    await waitFor(() => expect(api.generateHrReport).toHaveBeenCalledTimes(2));
    expect(sent(1)).toMatchObject({ lang: "ar", create_history: false });

    await act(async () => { arabic.resolve(report("تجربة الموارد البشرية")); });
    await act(async () => { english.resolve(report("TEST HR Demo")); await firstRun; });

    expect(result.current.generatedData).toEqual([{ employee_name: "تجربة الموارد البشرية" }]);
    expect(result.current.generating).toBe(false);
  });

  it("keeps waiting for the newest request when the older one answers first", async () => {
    const english = deferred<HrReportGenerateResult>();
    const arabic = deferred<HrReportGenerateResult>();
    api.generateHrReport.mockReturnValueOnce(english.promise).mockReturnValueOnce(arabic.promise);
    const result = setUp(payroll);

    let firstRun: Promise<void> = Promise.resolve();
    act(() => { firstRun = result.current.generateReport(payroll); });
    await act(() => changeLanguage("ar"));
    await waitFor(() => expect(api.generateHrReport).toHaveBeenCalledTimes(2));

    await act(async () => { english.resolve(report("TEST HR Demo")); await firstRun; });
    expect(result.current.generatedData).toBeNull();
    expect(result.current.generating).toBe(true);

    await act(async () => { arabic.resolve(report("تجربة الموارد البشرية")); });
    await waitFor(() => expect(result.current.generatedData).toEqual([{ employee_name: "تجربة الموارد البشرية" }]));
    expect(result.current.generating).toBe(false);
  });

  it("a browser-built report re-shown in another language logs no second history row or export", async () => {
    api.createReportHistory.mockResolvedValue({ id: 1 });
    const result = setUp(custom);
    await act(() => result.current.generateReport(custom));
    expect(api.createReportHistory).toHaveBeenCalledTimes(1);
    expect(api.logAudit).toHaveBeenCalledTimes(1);

    await act(() => changeLanguage("ar"));
    expect(result.current.generatedData).toHaveLength(1);
    expect(api.createReportHistory).toHaveBeenCalledTimes(1);
    expect(api.logAudit).toHaveBeenCalledTimes(1);
    expect(api.generateHrReport).not.toHaveBeenCalled();
  });
});
