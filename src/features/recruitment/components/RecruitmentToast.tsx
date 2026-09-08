import Toast from "@/shared/components/Toast";
import { arabicSource } from "@/i18n/source";

type RecruitmentToastProps = {
  message: string | null;
};

/**
 * Tone is derived from the message instead of a separate error flag, matching
 * the pattern used by the other feature-level toasts (e.g. HierarchyToast).
 */
const RecruitmentToast = ({ message }: RecruitmentToastProps) => {
  if (!message) return null;

  const isError = message.startsWith(arabicSource("common.error"));

  return (
    <Toast
      message={message}
      shape="banner"
      position="top-full"
      toneClassName={
        isError
          ? "bg-toast-error border border-toast-error-border shadow-lg text-center"
          : "bg-toast-success border border-toast-success-border shadow-lg text-center"
      }
      textClassName={isError ? "text-toast-error-fg font-medium" : "text-toast-success-fg font-medium"}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    />
  );
};

export default RecruitmentToast;
