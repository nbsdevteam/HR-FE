import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  enrolCardOnDevice,
  enrolFingerprintOnDevice,
  removeCredentialsFromDevice,
  syncEmployeeToDevice,
} from "@/shared/api/deviceSync";
import type { DeviceCredentialKind, DeviceEnrollment, DeviceEnrollmentReportResults } from "@/shared/hooks";
import { errorMessage } from "../utils/errorMessage";

export type EnrollmentInput = {
  dbId: string;
  deviceEmployeeNo: string;
  mode: "create" | "update";
  /** Always sourced from a `device_enrollment.pending` the caller just received — never recomputed client-side. */
  credentials: DeviceCredentialKind[];
  name: string;
  gender?: "male" | "female";
  /** Read only when `credentials` includes `"face"`. base64, no `data:` prefix. */
  facePhotoBase64?: string | null;
  /** Read only when `credentials` includes `"card"`. `null`/missing ⇒ reported as `"skipped"` (Odoo never stores the number, so it can't be auto-resent on retry/reactivate). */
  cardNo?: string | null;
};

export type EnrollmentOutcome = {
  results: DeviceEnrollmentReportResults;
  error?: string;
  deviceEnrollment: DeviceEnrollment | null;
};

/**
 * The one place every enrolment pass (create, retry, credentials-add,
 * reactivate) drives device-sync and reports the outcome back to Odoo — so
 * none of those call sites re-implement their own fetch + report loop
 * (hand-off §2/§3/§4/§5/§6/§7).
 */
export const useDeviceEnrollmentSync = () => {
  const [syncing, setSyncing] = useState(false);

  const runEnrollment = useCallback(async (input: EnrollmentInput): Promise<EnrollmentOutcome> => {
    setSyncing(true);
    const results: DeviceEnrollmentReportResults = {};
    let firstError: string | undefined;

    try {
      if (input.credentials.length > 0) {
        const syncRes = await syncEmployeeToDevice({
          employeeNo: input.deviceEmployeeNo,
          mode: input.mode,
          name: input.name,
          gender: input.gender,
          facePhoto: input.credentials.includes("face") ? input.facePhotoBase64 : undefined,
        });
        results.person = syncRes.success ? "synced" : "failed";
        if (input.credentials.includes("face")) results.face = syncRes.success ? "synced" : "failed";
        if (!syncRes.success) firstError ??= syncRes.error;
      }

      if (input.credentials.includes("card")) {
        if (!input.cardNo) {
          results.card = "skipped";
        } else {
          const cardRes = await enrolCardOnDevice(input.deviceEmployeeNo, input.cardNo);
          results.card = cardRes.success ? "synced" : "failed";
          if (!cardRes.success) firstError ??= cardRes.error;
        }
      }

      if (input.credentials.includes("fingerprint")) {
        const fpRes = await enrolFingerprintOnDevice(input.deviceEmployeeNo);
        results.fingerprint = fpRes.success ? "synced" : "failed";
        if (!fpRes.success) firstError ??= fpRes.error;
      }
    } catch (e: unknown) {
      firstError ??= errorMessage(e);
    }

    let deviceEnrollment: DeviceEnrollment | null = null;
    try {
      deviceEnrollment = await odooData.reportDeviceEnrollment(input.dbId, {
        device_employee_no: input.deviceEmployeeNo,
        results,
        ...(firstError ? { error: firstError } : {}),
      });
    } catch {
      // The report call is best-effort — its own failure must not crash the
      // caller's flow; the enrolment attempt above already happened either way.
    }

    setSyncing(false);
    return { results, error: firstError, deviceEnrollment };
  }, []);

  return { syncing, runEnrollment };
};

export type RemovalOutcome = {
  removed: boolean;
  error?: string;
  deviceEnrollment: DeviceEnrollment | null;
};

/** The removal counterpart of `useDeviceEnrollmentSync`, driven by deactivate/hard-terminate (backend §5/§7). */
export const useDeviceRemovalSync = () => {
  const [removing, setRemoving] = useState(false);

  const runRemoval = useCallback(async (dbId: string, deviceEmployeeNo: string): Promise<RemovalOutcome> => {
    setRemoving(true);
    let removed = false;
    let error: string | undefined;

    try {
      const res = await removeCredentialsFromDevice(deviceEmployeeNo, {
        removeFace: true,
        removeFingerprint: true,
        removePerson: true,
      });
      removed = !!res.success;
      if (!removed) error = res.error;
    } catch (e: unknown) {
      error = errorMessage(e);
    }

    let deviceEnrollment: DeviceEnrollment | null = null;
    try {
      deviceEnrollment = await odooData.reportDeviceEnrollment(dbId, {
        device_employee_no: deviceEmployeeNo,
        results: { removal: removed ? "removed" : "failed" },
        ...(error ? { error } : {}),
      });
    } catch {
      // Best-effort, same as above.
    }

    setRemoving(false);
    return { removed, error, deviceEnrollment };
  }, []);

  return { removing, runRemoval };
};
