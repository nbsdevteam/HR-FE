import { PauseCircle, PlayCircle } from "lucide-react";
import Modal from "@/shared/components/Modal";
import ModalFooterActions from "@/shared/components/ModalFooterActions";
import { arabicSource } from "@/i18n/source";

type DeviceSyncPauseModalProps = {
  pausing: boolean;
  reason: string;
  saving: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const DeviceSyncPauseModal = ({
  pausing,
  reason,
  saving,
  onReasonChange,
  onConfirm,
  onCancel,
}: DeviceSyncPauseModalProps) => {
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onReasonChange(e.target.value);
  };

  return (
    <Modal
      onClose={onCancel}
      title={
        pausing
          ? arabicSource("settings.device_sync_pause_confirm_title")
          : arabicSource("settings.device_sync_resume_confirm_title")
      }
      icon={pausing ? PauseCircle : PlayCircle}
      footer={
        <ModalFooterActions
          onCancel={onCancel}
          onConfirm={onConfirm}
          confirmLabel={
            pausing
              ? arabicSource("settings.device_sync_pause_action")
              : arabicSource("settings.device_sync_resume_action")
          }
          loading={saving}
        />
      }
    >
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>
        {pausing
          ? arabicSource("settings.device_sync_pause_confirm_body")
          : arabicSource("settings.device_sync_resume_confirm_body")}
      </p>
      <div>
        <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
          {arabicSource("settings.device_sync_pause_reason_label")}
        </label>
        <textarea
          value={reason}
          onChange={handleReasonChange}
          placeholder={arabicSource("settings.device_sync_pause_reason_placeholder")}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none resize-none"
          style={{ fontSize: 13 }}
        />
      </div>
    </Modal>
  );
};

export default DeviceSyncPauseModal;
