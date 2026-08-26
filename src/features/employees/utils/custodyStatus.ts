import { STATUS_TONES } from "@/shared/utils/statusColors";
import { arabicSource } from "@/i18n/source";
import type { CustodyStatus } from "../types";

/** Ordered so `<select>`/badge lists render active first, terminal states last. */
export const CUSTODY_STATUS_KEYS: readonly CustodyStatus[] = ["active", "returned", "damaged", "lost"];

export const custodyStatusLabels: Record<CustodyStatus, string> = {
  active: arabicSource("shared.custody_status_active"),
  returned: arabicSource("shared.custody_status_returned"),
  damaged: arabicSource("shared.custody_status_damaged"),
  lost: arabicSource("shared.custody_status_lost"),
};

export const custodyStatusColors: Record<CustodyStatus, string> = {
  active: STATUS_TONES.success,
  returned: STATUS_TONES.info,
  damaged: STATUS_TONES.warning,
  lost: STATUS_TONES.danger,
};
