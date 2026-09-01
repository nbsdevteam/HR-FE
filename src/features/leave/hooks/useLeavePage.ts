import { useCallback, useEffect, useMemo, useState } from "react";
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
  useLeaveSettings,
  useLeaveTypes,
} from "@/shared/hooks";
import type { DbLeaveRequest } from "@/shared/hooks";
import type { LeaveSortKey, LeaveTabId, LeaveViewMode } from "../types";

export const useLeavePage = () => {
  const [activeTab, setActiveTab] = useState<LeaveTabId>("requests");
  const [filter, setFilter] = useState(arabicSource("common.all"));
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPermForm, setShowPermForm] = useState(false);
  const [viewingAttachmentsFor, setViewingAttachmentsFor] = useState<DbLeaveRequest | null>(null);
  const [followingUpOnExcuse, setFollowingUpOnExcuse] = useState<DbLeaveRequest | null>(null);
  const [viewMode, setViewMode] = useState<LeaveViewMode>("list");
  const [leaveSortBy, setLeaveSortBy] = useState<LeaveSortKey>("start");
  const [leaveSortDir, setLeaveSortDir] = useState<"asc" | "desc">("desc");

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
  const { balances, loading: balLoading, refetch: refetchBalances } = useLeaveBalances(
    currentYear,
    activeTab === "balances",
  );
  const { permissions, loading: permLoading, refetch: refetchPermissions } = useLeavePermissions();
  const { settings: leaveSettings } = useLeaveSettings();

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
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      list = list.filter((request) => {
        const employee = empMap[request.employee_id];
        const name = employee ? empDisplayName(employee) : "";
        return (
          name.toLowerCase().includes(normalizedSearch) ||
          request.leave_type.toLowerCase().includes(normalizedSearch) ||
          (request.reason || "").toLowerCase().includes(normalizedSearch)
        );
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

  // One pass over the request list instead of three full scans.
  const { pendingCount, approvedCount, rejectedCount } = useMemo(() => {
    const accepted = arabicSource("common.accepted");
    const rejected = arabicSource("common.rejected_3");
    let pending = 0;
    let approved = 0;
    let refused = 0;
    requests.forEach((request) => {
      if (isLeavePending(request.status)) pending++;
      const status = normalizeLeaveStatus(request.status);
      if (status === accepted) approved++;
      else if (status === rejected) refused++;
    });
    return { pendingCount: pending, approvedCount: approved, rejectedCount: refused };
  }, [requests]);

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

  const handleViewAttachments = useCallback((leave: DbLeaveRequest) => {
    setViewingAttachmentsFor(leave);
  }, []);

  const handleCloseAttachments = useCallback(() => {
    setViewingAttachmentsFor(null);
  }, []);

  const handleOpenFollowUpExcuse = useCallback((leave: DbLeaveRequest) => {
    setFollowingUpOnExcuse(leave);
  }, []);

  const handleCloseFollowUpExcuse = useCallback(() => {
    setFollowingUpOnExcuse(null);
  }, []);

  const handleSubmitFollowUpExcuse = useCallback(async (leaveId: string, note: string) => {
    await odooData.followUpLeaveExcuse(leaveId, note || undefined);
    setFollowingUpOnExcuse(null);
    refetchRequests();
  }, [refetchRequests]);

  // Keep the open attachments modal's leave in sync after an upload/delete
  // triggers a refetch — `requests` gets a fresh object, `viewingAttachmentsFor`
  // otherwise stays pinned to the stale snapshot it was opened with.
  useEffect(() => {
    if (!viewingAttachmentsFor) return;
    const updated = requests.find((request) => request.id === viewingAttachmentsFor.id);
    if (updated && updated !== viewingAttachmentsFor) setViewingAttachmentsFor(updated);
  }, [requests, viewingAttachmentsFor]);

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
    followingUpOnExcuse,
    handleApprove,
    handleCloseAttachments,
    handleCloseFollowUpExcuse,
    handleDelete,
    handleLeaveSubmit,
    handleOpenFollowUpExcuse,
    handlePermissionSubmit,
    handleReject,
    handleSubmitFollowUpExcuse,
    handleViewAttachments,
    leaveSettings,
    leaveSortBy,
    leaveSortDir,
    loading,
    pendingCount,
    permissions,
    permLoading,
    policies,
    refetchPermissions,
    refetchRequests,
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
    viewingAttachmentsFor,
    viewMode,
  };
};
