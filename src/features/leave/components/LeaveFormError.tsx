import { AlertCircle } from "lucide-react";

type LeaveFormErrorProps = {
  message: string;
};

/** Inline validation/submit error banner shared by the leave + permission modals. */
const LeaveFormError = ({ message }: LeaveFormErrorProps) => {
  if (!message) return null;

  return (
    <div
      className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive"
      style={{ fontSize: 13 }}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
};

export default LeaveFormError;
