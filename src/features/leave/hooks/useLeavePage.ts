import { useCallback, useMemo, useState } from "react";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, normalizeLeaveStatus } from "@/i18n/status";
import * as odooData from "@/shared/api/odooData";
import {
  empDisplayName,
  useLeaveBalances,
  useLeaveEmployeeScope,
  useLeavePermissions,
  useLeavePolicies,
  useLeaveRequests,
  useLeaveTypes,
} from "@/shared/hooks";
import type { LeaveSortKey, LeaveTabId, LeaveViewMode } from "../types";

export const useLeavePage = () => {
  const {
    employees,
    loading: empLoading,
    selfOnly,
    linkError: employeeLinkError,
  } = useLeaveEmployeeScope();
  const { types: leaveTypes, loading: typesLoading } = useLeaveTypes();
  const { policies } = useLeavePolicies();
  const { requests, loading: reqLoading, refetch: refetchRequests } = useLeaveRequests();
  const currentYear = new Date().getFullYear();
  const { balances, loading: balLoading, refetch: refetchBalances } = useLeaveBalances(currentYear);
  const { permissions, loading: permLoading, refetch: refetchPermissions } = useLeavePermissions();

  const [activeTab, setActiveTab] = useState<LeaveTabId>("requests");
  const [filter, setFilter] = useState(arabicSource("common.all"));
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPermForm, setShowPermForm] = useState(false);
  const [viewMode, setViewMode] = useState<LeaveViewMode>("list");
  const [leaveSortBy, setLeaveSortBy] = useState<LeaveSortKey>("start");
  const [leaveSortDir, setLeaveSortDir] = useState<"asc" | "desc">("desc");

  const empMap = useMemo(() => {
    const mappedEmployees: Record<string, (typeof employees)[number]> = {};
    employees.forEach((employee) => {
      mappedEmployees[employee.id] = employee;
    });
    return mappedEmployees;
  }, [employees]);

  const activeLeaveTypes = useMemo(
    () => leaveTypes.filter((leaveType) => leaveType.is_active),
    [leaveTypes],
  );

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (filter !== arabicSource("common.all")) {
      list = list.filter((request) => normalizeLeaveStatus(request.status) === filter);
    }
    if (search) {
      list = list.filter((request) => {
        const employee = empMap[request.employee_id];
        const name = employee ? empDisplayName(employee) : "";
        return name.includes(search) || request.leave_type.includes(search) || (request.reason || "").includes(search);
      });
    }

    const dir = leaveSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (leaveSortBy === "employee") {
        const nameA = empMap[a.employee_id] ? empDisplayName(empMap[a.employee_id]) : "";
        const nameB = empMap[b.employee_id] ? empDisplayName(empMap[b.employee_id]) : "";
        return dir * nameA.localeCompare(nameB, "ar");
      }
      if (leaveSortBy === "type") return dir * (a.leave_type || "").localeCompare(b.leave_type || "", "ar");
      if (leaveSortBy === "start") return dir * (a.start_date || "").localeCompare(b.start_date || "");
      if (leaveSortBy === "end") return dir * (a.end_date || "").localeCompare(b.end_date || "");
      if (leaveSortBy === "days") return dir * ((a.days || 0) - (b.days || 0));
      if (leaveSortBy === "status") return dir * normalizeLeaveStatus(a.status).localeCompare(normalizeLeaveStatus(b.status), "ar");
      return 0;
    });
    return list;
  }, [empMap, filter, leaveSortBy, leaveSortDir, requests, search]);

  const pendingCount = useMemo(() => requests.filter((request) => isLeavePending(request.status)).length, [requests]);

  const approvedCount = useMemo(
    () => requests.filter((request) => normalizeLeaveStatus(request.status) === arabicSource("common.accepted")).length,
    [requests],
  );

  const rejectedCount = useMemo(
    () => requests.filter((request) => normalizeLeaveStatus(request.status) === arabicSource("common.rejected_3")).length,
    [requests],
  );

  const loading = useMemo(
    () => empLoading || typesLoading || reqLoading || balLoading || permLoading,
    [balLoading, empLoading, permLoading, reqLoading, typesLoading],
  );

  const handleApprove = useCallback(async (id: string) => {
    try {
      try {
        await odooData.hrApproveLeave(id);
      } catch {
        await odooData.managerApproveLeave(id);
      }
      refetchRequests();
      refetchBalances();
    } catch (error: any) {
      console.error("Approve error:", error.message);
      localizedAlert(`${arabicSource("leave.error_accepting_request")} ${error.message}`);
    }
  }, [refetchBalances, refetchRequests]);

  const handleReject = useCallback(async (id: string, reason?: string) => {
    try {
      await odooData.refuseLeave(id, reason);
      refetchRequests();
    } catch (error: any) {
      console.error("Reject error:", error.message);
      localizedAlert(`${arabicSource("leave.error_rejecting_the_request")} ${error.message}`);
    }
  }, [refetchRequests]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await odooData.cancelLeave(id);
      refetchRequests();
      refetchBalances();
    } catch (error: any) {
      console.error("Delete error:", error.message);
      localizedAlert(`${arabicSource("leave.error_deleting_request")} ${error.message}`);
    }
  }, [refetchBalances, refetchRequests]);

  const handleLeaveSubmit = useCallback(async () => {
    refetchRequests();
    refetchBalances();
    setShowForm(false);
  }, [refetchBalances, refetchRequests]);

  const handlePermissionSubmit = useCallback(async () => {
    refetchPermissions();
    setShowPermForm(false);
  }, [refetchPermissions]);

  return {
    activeLeaveTypes,
    activeTab,
    approvedCount,
    balances,
    balLoading,
    currentYear,
    employeeLinkError,
    employees,
    empLoading,
    empMap,
    filter,
    filteredRequests,
    handleApprove,
    handleDelete,
    handleLeaveSubmit,
    handlePermissionSubmit,
    handleReject,
    leaveSortBy,
    leaveSortDir,
    loading,
    pendingCount,
    permissions,
    permLoading,
    policies,
    refetchPermissions,
    rejectedCount,
    search,
    selfOnly,
    setActiveTab,
    setFilter,
    setLeaveSortBy,
    setLeaveSortDir,
    setSearch,
    setShowForm,
    setShowPermForm,
    setViewMode,
    showForm,
    showPermForm,
    viewMode,
  };
};
