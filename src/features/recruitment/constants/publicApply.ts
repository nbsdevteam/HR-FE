import { arabicSource } from "@/i18n/source";

export const acceptedResumeTypes = ".pdf,.doc,.docx,.txt,.rtf";

export const publicApplyErrorKeys: Record<string, Parameters<typeof arabicSource>[0]> = {
  file_too_large: "apply.error_file_too_large",
  file_type: "apply.error_file_type",
  rate_limited: "apply.error_rate_limited",
};
