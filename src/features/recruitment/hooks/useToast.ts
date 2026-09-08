import { useCallback, useState } from "react";

export type ToastTone = "success" | "error";

export const useToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("success");

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToastMessage(message);
    setToastTone(tone);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  return { toastMessage, toastTone, showToast };
};
