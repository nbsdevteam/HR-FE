import type { ExitSettlement } from "@/shared/hooks";

/** One clearance line as the employee sees it. */
export type PublicExitClearanceLine = {
  item: string;
  category: string;
  completed: boolean;
};

/** The signing link's state; only `sent` and `viewed` can still be decided. */
export type PublicExitSignState = "sent" | "viewed" | "signed" | "rejected" | "expired" | "revoked";

/**
 * What `/api/hr/public/exit_sign/open` returns. When the link can no longer be
 * decided the backend sends only `state` and `decided_at`, so every other field is optional.
 */
export type PublicExitSignInfo = {
  state: PublicExitSignState;
  decidedAt: string | null;
  expiresAt: string | null;
  employeeName: string;
  companyName: string;
  exitType: string;
  exitDate: string;
  lastWorkingDay: string;
  clearance: PublicExitClearanceLine[];
  settlement: ExitSettlement | null;
};

/** What the employee decided, sent to `/decide`. */
export type PublicExitSignDecision =
  | { accept: true; typedName: string; signatureImage: string; notes?: string }
  | { accept: false; typedName: string; notes?: string };
