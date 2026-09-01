import { AnimatePresence } from "motion/react";
import { AlertTriangle, UserCheck } from "lucide-react";
import Toast from "@/shared/components/Toast";
import { arabicSource } from "@/i18n/source";

type HierarchyToastProps = {
  message: string | null;
};

/**
 * The page's status pill. Tone is derived once from the message instead of
 * re-testing the same prefix for every class name.
 */
const HierarchyToast = ({ message }: HierarchyToastProps) => {
  const isError = message?.startsWith(arabicSource("common.error")) ?? false;

  return (
    <AnimatePresence>
      {message && (
        <Toast
          message={message}
          icon={isError ? AlertTriangle : UserCheck}
          position="bottom-center"
          toneClassName={
            isError
              ? "bg-toast-error border-toast-error-border"
              : "bg-toast-success border-toast-success-border"
          }
          iconBoxClassName={isError ? "bg-toast-error-border/25" : "bg-toast-success-border/25"}
          iconClassName={
            isError
              ? "w-3 h-3 text-toast-error-fg"
              : "w-3 h-3 text-toast-success-fg"
          }
          textClassName={isError ? "text-toast-error-fg font-medium" : "text-toast-success-fg font-medium"}
          textSize={12}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
        />
      )}
    </AnimatePresence>
  );
};

export default HierarchyToast;
