import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import type { DeviceCredentialKind, DeviceEnrollment } from "@/shared/hooks";
import type { Employee } from "../types";
import { errorMessage } from "../utils/errorMessage";
import { stripDataUrlPrefix } from "../utils/photoDataUrl";
import { useDeviceEnrollmentSync, useDeviceRemovalSync } from "./useDeviceEnrollmentSync";

/**
 * Add/replace a device credential on an already-active employee (backend §4/
 * §6), plus the Retry action (§5). All three share the same
 * request-then-enrol-then-report loop, sourced from whatever `pending` the
 * backend just echoed back — never recomputed client-side.
 */
export const useEmployeeCredentialActions = (
  employee: Employee,
  setEditData: Dispatch<SetStateAction<Employee>>,
) => {
  const [cardNumberDraft, setCardNumberDraft] = useState("");
  const [showCardInput, setShowCardInput] = useState(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const { syncing: enrollmentSyncing, runEnrollment } = useDeviceEnrollmentSync();
  const { removing, runRemoval } = useDeviceRemovalSync();
  // The list payload has no `device_enrollment` block, so a panel opened from
  // a row would show no banner — no failed enrolment, no failed removal, and
  // nothing to retry. The detail endpoint carries it.
  const detailQuery = useQuery({
    queryKey: ["employees", "detail", employee.dbId],
    queryFn: () => odooData.fetchEmployee(employee.dbId),
    enabled: Boolean(employee.deviceEmployeeNo) && !employee.deviceEnrollment,
    staleTime: STALE_TIME.SHORT,
  });
  const credentialSyncing = enrollmentSyncing || removing;

  const applyEnrollment = useCallback((enrollment: DeviceEnrollment | null) => {
    if (enrollment) setEditData(prev => ({ ...prev, deviceEnrollment: enrollment }));
  }, [setEditData]);

  const enrolPending = useCallback(async (
    pending: DeviceCredentialKind[],
    mode: "create" | "update",
    cardNo?: string | null,
  ) => {
    if (!employee.deviceEmployeeNo || pending.length === 0) return;
    const outcome = await runEnrollment({
      dbId: employee.dbId,
      deviceEmployeeNo: employee.deviceEmployeeNo,
      mode,
      credentials: pending,
      name: employee.name,
      facePhotoBase64: pending.includes("face") ? stripDataUrlPrefix(employee.photo) : undefined,
      cardNo: pending.includes("card") ? (cardNo ?? null) : undefined,
    });
    applyEnrollment(outcome.deviceEnrollment);
  }, [employee, runEnrollment, applyEnrollment]);

  const requestAndEnrol = useCallback(async (credentials: DeviceCredentialKind[], cardNo?: string | null) => {
    setCredentialError(null);
    try {
      const requested = await odooData.requestDeviceCredentials(employee.dbId, credentials);
      applyEnrollment(requested);
      await enrolPending(requested?.pending ?? credentials, requested?.mode === "create" ? "create" : "update", cardNo);
    } catch (e: unknown) {
      setCredentialError(errorMessage(e));
    }
  }, [employee.dbId, applyEnrollment, enrolPending]);

  const handleEnrolCard = useCallback(() => {
    const cardNo = cardNumberDraft.trim();
    if (!cardNo) return;
    setCardNumberDraft("");
    setShowCardInput(false);
    void requestAndEnrol(["card"], cardNo);
  }, [cardNumberDraft, requestAndEnrol]);

  const handleEnrolFingerprint = useCallback(() => {
    void requestAndEnrol(["fingerprint"]);
  }, [requestAndEnrol]);

  const handlePushPhotoToDevice = useCallback(() => {
    void requestAndEnrol(["face"]);
  }, [requestAndEnrol]);

  /**
   * A deactivated (or exited) employee whose removal failed is still on the
   * terminal. The enrolment retry is refused for them, so this re-runs the
   * removal pass itself; the backend accepts its report in removal states.
   */
  const handleRetryRemoval = useCallback(async () => {
    if (!employee.deviceEmployeeNo) return;
    setCredentialError(null);
    const outcome = await runRemoval(employee.dbId, employee.deviceEmployeeNo);
    applyEnrollment(outcome.deviceEnrollment);
  }, [employee.dbId, employee.deviceEmployeeNo, runRemoval, applyEnrollment]);

  const handleRetryEnrollment = useCallback(async () => {
    setCredentialError(null);
    const cardNo = cardNumberDraft.trim() || null;
    try {
      const retried = await odooData.retryDeviceEnrollment(employee.dbId);
      applyEnrollment(retried);
      if (!retried) return;
      setCardNumberDraft("");
      setShowCardInput(false);
      const credentials = retried.pending.filter(c => c !== "card" || cardNo);
      await enrolPending(credentials, retried.mode === "create" ? "create" : "update", cardNo);
    } catch (e: unknown) {
      setCredentialError(errorMessage(e));
    }
  }, [employee.dbId, cardNumberDraft, applyEnrollment, enrolPending]);

  useEffect(() => {
    const loaded = detailQuery.data?.device_enrollment;
    // Never over a newer block an action in this panel already applied.
    if (loaded) setEditData(prev => (prev.deviceEnrollment ? prev : { ...prev, deviceEnrollment: loaded }));
  }, [detailQuery.data, setEditData]);

  return {
    cardNumberDraft,
    setCardNumberDraft,
    showCardInput,
    setShowCardInput,
    credentialSyncing,
    credentialError,
    handleEnrolCard,
    handleEnrolFingerprint,
    handlePushPhotoToDevice,
    handleRetryEnrollment,
    handleRetryRemoval,
  };
};
