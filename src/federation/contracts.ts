/**
 * MIRROR of @nbs/contracts (CRM-FE, packages/contracts/src/index.ts).
 *
 * HR-FE is its own repository, so it cannot import the workspace package directly. These types are
 * copied deliberately rather than loosened to `any`: they are the contract between this app's
 * exposed components and the CRM shell that mounts them, and a silent drift here is a runtime prop
 * mismatch inside somebody else's screen.
 *
 * TODO: publish @nbs/contracts to the internal registry and depend on it, at which point this file
 * is deleted. Until then, any change here must be made in both repos in the same pull request.
 */

export interface EmployeePickerProps {
  value?: string | null;
  onChange: (employeeId: string | null) => void;
  departmentId?: string;
  placeholder?: string;
}

export interface EmployeeAvatarProps {
  employeeId: string;
  size?: 'sm' | 'md' | 'lg';
  showPresence?: boolean;
}

export interface EmployeeDetailSheetProps {
  employeeId: string;
  open: boolean;
  onClose: () => void;
}

export interface ShiftScheduleProps {
  scope: { kind: 'department' | 'team' | 'agent-group'; id: string };
  weekStart?: string;
}

/** Contact Center's dialer, consumed by HR — the other direction of the federation. */
export interface ClickToCallProps {
  phone: string;
  customerId?: string;
  displayName?: string;
  variant?: 'button' | 'icon' | 'inline';
  onCallPlaced?: (callId: string) => void;
}

export const CROSS_APP_EVENTS = {
  callAnswered: 'nbs:call-answered',
  callEnded: 'nbs:call-ended',
  customerUpdated: 'nbs:customer-updated',
  orderStateChanged: 'nbs:order-state-changed',
  employeeUpdated: 'nbs:employee-updated',
} as const;

export type CrossAppEventName = (typeof CROSS_APP_EVENTS)[keyof typeof CROSS_APP_EVENTS];

export const emitCrossAppEvent = (name: CrossAppEventName, payload: unknown): void => {
  window.dispatchEvent(new CustomEvent(name, { detail: payload }));
};

export const onCrossAppEvent = (
  name: CrossAppEventName,
  handler: (payload: unknown) => void
): (() => void) => {
  const listener = (event: Event) => handler((event as CustomEvent).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
};
