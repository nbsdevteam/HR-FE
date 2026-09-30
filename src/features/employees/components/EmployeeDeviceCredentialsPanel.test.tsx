import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { mapDeviceEnrollment, mapEmployee } from "@/shared/api/mappers";
import { arabicSource } from "@/i18n/source";
import { toEmployee } from "../utils/employeeMapper";
import EmployeeDeviceCredentialsPanel from "./EmployeeDeviceCredentialsPanel";

const employee = (status: string, enrollment: Record<string, unknown>) => ({
  ...toEmployee(mapEmployee({
    id: 186, person_id: 4447, name: "Suraj", device_employee_no: "4447",
    status, active: status === "active", read_only: status === "inactive",
  }), new Map()),
  deviceEnrollment: mapDeviceEnrollment({ device_employee_no: "4447", ...enrollment }),
});

const renderPanel = (emp: ReturnType<typeof employee>) => {
  const handlers = { handleRetryEnrollment: vi.fn(), handleRetryRemoval: vi.fn() };
  render(
    <EmployeeDeviceCredentialsPanel
      employee={emp}
      cardNumberDraft=""
      setCardNumberDraft={vi.fn()}
      showCardInput={false}
      setShowCardInput={vi.fn()}
      credentialSyncing={false}
      credentialError={null}
      handleEnrolCard={vi.fn()}
      handleEnrolFingerprint={vi.fn()}
      {...handlers}
    />,
  );
  return handlers;
};

describe("EmployeeDeviceCredentialsPanel retry", () => {
  it("retries a failed removal on a deactivated (read-only) employee by removing again", () => {
    const handlers = renderPanel(employee("inactive", {
      state: "removal_failed", action: "remove", retry_required: true, last_error: "device_sync_unreachable",
    }));

    expect(screen.getByText(arabicSource("employees.device_sync_error_unreachable"), { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByText(arabicSource("employees.retry")));

    expect(handlers.handleRetryRemoval).toHaveBeenCalledTimes(1);
    expect(handlers.handleRetryEnrollment).not.toHaveBeenCalled();
  });

  it("retries a failed enrolment on an active employee as an enrolment", () => {
    const handlers = renderPanel(employee("active", { state: "failed", action: "enroll", retry_required: true }));

    fireEvent.click(screen.getByText(arabicSource("employees.retry")));

    expect(handlers.handleRetryEnrollment).toHaveBeenCalledTimes(1);
    expect(handlers.handleRetryRemoval).not.toHaveBeenCalled();
  });
});
