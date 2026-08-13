import { RequireHr } from "./RequireHr";
import { Payroll } from "../pages/Payroll";
import { DeviceManagement } from "../pages/DeviceManagement";
import { AuditCenter } from "../pages/AuditCenter";
import { SettingsPage } from "../pages/Settings";
import { PHASE1_GATES } from "../lib/permissions";

export function GuardedPayroll() {
  return (
    <RequireHr route="hr.payroll">
      <Payroll />
    </RequireHr>
  );
}

export function GuardedDevices() {
  return (
    <RequireHr route="hr.devices">
      <DeviceManagement />
    </RequireHr>
  );
}

export function GuardedAudit() {
  return (
    <RequireHr anyRoute={PHASE1_GATES.audit.routes}>
      <AuditCenter />
    </RequireHr>
  );
}

export function GuardedSettings() {
  return (
    <RequireHr anyPerm={PHASE1_GATES.settings.permissions}>
      <SettingsPage />
    </RequireHr>
  );
}
