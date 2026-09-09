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
      shape="card"
      position="top-end"
      toneClassName={
        isError
          ? "bg-toast-error border-toast-error-border"
          : "bg-toast-success border-toast-success-border"
      }
      textClassName={isError ? "text-toast-error-fg font-medium" : "text-toast-success-fg font-medium"}
      textSize={14}
    />
  );
};

export default RecruitmentToast;
