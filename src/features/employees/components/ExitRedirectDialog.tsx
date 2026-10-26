import { LogOut } from "lucide-react";
import { Modal, ModalFooterActions } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ExitRedirectTarget } from "../hooks/useExitRedirect";

type ExitRedirectDialogProps = {
  target: ExitRedirectTarget;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Explains why a delete / deactivate / terminate was refused and offers the
 * End of Service path instead — a new process, or the one already open.
 */
const ExitRedirectDialog = ({ target, onConfirm, onClose }: ExitRedirectDialogProps) => {
  const isOpenProcess = target.redirect.kind === "open";

  return (
    <Modal
      onClose={onClose}
      icon={LogOut}
      title={arabicSource("employees.exit_redirect_title")}
      subtitle={target.employeeName}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onConfirm}
          confirmLabel={isOpenProcess ? arabicSource("employees.exit_redirect_open") : arabicSource("employees.exit_redirect_start")}
          confirmIcon={LogOut}
        />
      }
    >
      <p className="text-muted-foreground" style={{ fontSize: 14 }}>
        {isOpenProcess
          ? arabicSource("employees.exit_redirect_open_message")
          : arabicSource("employees.exit_redirect_start_message")}
      </p>
    </Modal>
  );
};

export default ExitRedirectDialog;
