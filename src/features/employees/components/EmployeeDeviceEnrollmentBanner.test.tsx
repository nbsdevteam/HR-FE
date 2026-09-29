import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { arabicSource } from "@/i18n/source";
import type { DeviceEnrollment } from "../types";
import EmployeeDeviceEnrollmentBanner from "./EmployeeDeviceEnrollmentBanner";
import EmployeeDeviceStatusBadge from "./EmployeeDeviceStatusBadge";

const enrollment = (patch: Partial<DeviceEnrollment>): DeviceEnrollment => ({
  device_employee_no: "1042",
  state: "enrolled",
  mode: "update",
  requested: [],
  pending: [],
  synced: [],
  failed: [],
  action: "",
  retry_required: false,
  can_enroll: true,
  device_sync_paused: false,
  last_error: null,
  attempts: 0,
  updated_at: null,
  removed_by: null,
  removed_at: null,
  ...patch,
});

describe("EmployeeDeviceEnrollmentBanner", () => {
  it("says the terminal removed the person, and when, in Baghdad time as sent", () => {
    render(
      <EmployeeDeviceEnrollmentBanner
        enrollment={enrollment({ state: "removed", removed_by: "device", removed_at: "2026-09-29T14:05:00+03:00" })}
      />,
    );

    expect(screen.getByText(arabicSource("employees.device_enrollment_removed_on_device"), { exact: false })).toBeInTheDocument();
    expect(screen.getByText("· 2026-09-29 14:05", { exact: false })).toBeInTheDocument();
  });

  it("says plainly removed when HR removed the person", () => {
    render(<EmployeeDeviceEnrollmentBanner enrollment={enrollment({ state: "removed", removed_by: "hr" })} />);

    expect(screen.getByText(arabicSource("employees.device_enrollment_removed"), { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(arabicSource("employees.device_enrollment_removed_on_device"), { exact: false })).toBeNull();
  });

  it("localizes a stored device-sync error code", () => {
    render(<EmployeeDeviceEnrollmentBanner enrollment={enrollment({ state: "failed", last_error: "device_number_taken: Ali" })} />);

    expect(screen.getByText(`${arabicSource("employees.device_sync_error_number_taken")} (Ali)`, { exact: false })).toBeInTheDocument();
  });

  it("renders nothing for an untracked legacy enrolment, but does for a tracked one", () => {
    const { container, rerender } = render(<EmployeeDeviceEnrollmentBanner enrollment={enrollment({ state: "untracked" })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<EmployeeDeviceEnrollmentBanner enrollment={enrollment({ state: "enrolled" })} />);
    expect(screen.getByText(arabicSource("employees.device_enrollment_enrolled"))).toBeInTheDocument();
  });
});

describe("EmployeeDeviceStatusBadge", () => {
  it("shows a removed person as removed even though the device number stays", () => {
    render(<EmployeeDeviceStatusBadge isPending={false} isDeviceSynced enrollmentState="removed" />);

    expect(screen.getByText(arabicSource("employees.device_enrollment_removed"))).toBeInTheDocument();
    expect(screen.queryByText(arabicSource("employees.registered"))).toBeNull();
  });

  it("still shows registered for a person on the terminal", () => {
    render(<EmployeeDeviceStatusBadge isPending={false} isDeviceSynced enrollmentState="enrolled" />);

    expect(screen.getByText(arabicSource("employees.registered"))).toBeInTheDocument();
  });
});
