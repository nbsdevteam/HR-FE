import type { ArabicSourceKey } from "@/i18n/source";
import type { PublicLeaveVerificationMethod } from "../types/publicLeave";

/** Prompt copy + input type per `verification_method` (backend hand-off §4). Shared by the request flow's verify step and the track-a-request screen. */
export const PUBLIC_LEAVE_VERIFY_PROMPTS: Partial<Record<PublicLeaveVerificationMethod, { labelKey: ArabicSourceKey; inputType: string }>> = {
  employee_code: { labelKey: "public_leave.verify_employee_code_label", inputType: "text" },
  birthday: { labelKey: "public_leave.verify_birthday_label", inputType: "date" },
  phone_last4: { labelKey: "public_leave.verify_phone_last4_label", inputType: "tel" },
};
