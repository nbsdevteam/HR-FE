import { Send } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type LeaveModalActionsProps = {
  submitLabel: string;
  saving: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

/** Submit/cancel footer shared by the leave request and permission modals. */
const LeaveModalActions = ({
  submitLabel,
  saving,
  disabled = false,
  onSubmit,
  onClose,
}: LeaveModalActionsProps) => (
  <div className="flex gap-3 pt-2">
    <Button
      onClick={onSubmit}
      disabled={disabled}
      loading={saving}
      icon={Send}
      className="flex-1 h-11 shadow-lg shadow-primary/20 cursor-pointer"
    >
      {submitLabel}
    </Button>
    <Button
      variant="outline"
      onClick={onClose}
      className="flex-1 h-11 cursor-pointer"
    >
      {arabicSource("common.cancel")}
    </Button>
  </div>
);

export default LeaveModalActions;
