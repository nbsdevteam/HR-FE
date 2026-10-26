import type { HrApiError } from "@/shared/api/client";

/**
 * Where an employee action that the backend refuses should send the user.
 * Anyone with HR history leaves through End of Service, so a delete, status
 * change, update to `exited`, mark-as-ex-employee or contract Terminate comes
 * back with one of these codes instead of doing the work.
 */
export type ExitRedirect =
  /** `use_end_of_service` — open Start End of Service for this employee. */
  | { kind: "start"; employeeId: string }
  /** `exit_process_open` — open the End of Service record that already exists. */
  | { kind: "open"; exitId: string; exitStatus: string | null };

const idOrNull = (value: unknown): string | null =>
  value === null || value === undefined || value === false || value === "" ? null : String(value);

/**
 * Reads a refusal's `error_code`. `fallbackEmployeeId` covers the employee
 * actions, whose refusal does not repeat the id the caller just sent; the
 * contract refusal carries its own `employee_id`.
 */
export const exitRedirectFromError = (error: unknown, fallbackEmployeeId?: string): ExitRedirect | null => {
  const apiError = error as HrApiError | undefined;
  const details = apiError?.details;
  if (apiError?.code === "use_end_of_service") {
    const employeeId = idOrNull(details?.employee_id) ?? fallbackEmployeeId ?? null;
    return employeeId ? { kind: "start", employeeId } : null;
  }
  if (apiError?.code === "exit_process_open") {
    const exitId = idOrNull(details?.exit_id);
    return exitId ? { kind: "open", exitId, exitStatus: idOrNull(details?.exit_status) } : null;
  }
  return null;
};

/** `use_rehire`: the restored employee left through End of Service and needs a new contract. */
export const isRehireRequired = (error: unknown): boolean =>
  (error as HrApiError | undefined)?.code === "use_rehire";

/** The Life cycle screen deep links: `?tab=exit&exit=<id>` opens a record, `&start=<id>` opens the new-process form. */
export const exitRedirectSearch = (redirect: ExitRedirect): string =>
  redirect.kind === "open"
    ? `?tab=exit&exit=${encodeURIComponent(redirect.exitId)}`
    : `?tab=exit&start=${encodeURIComponent(redirect.employeeId)}`;
