import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DeviceCredentialKind, DeviceEnrollment } from "@/shared/hooks";
import type { Employee } from "../types";
import { errorMessage } from "../utils/errorMessage";
import { stripDataUrlPrefix } from "../utils/photoDataUrl";
import { useDeviceEnrollmentSync } from "./useDeviceEnrollmentSync";

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
  const { syncing: credentialSyncing, runEnrollment } = useDeviceEnrollmentSync();

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
  };
};
