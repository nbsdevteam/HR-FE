import Toast from "@/shared/components/Toast";
import type { ToastTone } from "../hooks/useToast";

type RecruitmentToastProps = {
  message: string | null;
  tone: ToastTone;
};

const RecruitmentToast = ({ message, tone }: RecruitmentToastProps) => {
  if (!message) return null;

  const isError = tone === "error";

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
