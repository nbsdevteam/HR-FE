import { memo, useCallback } from "react";
import { CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import { Button } from "@/shared/components";
import type { ExitSignature } from "@/shared/hooks";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import { EXIT_SIGNATURE_STATE_KEYS, EXIT_SIGNER_ROLE_KEYS } from "../utils/exitStages";

type ExitSignatureRowProps = {
  signature: ExitSignature;
  busy: boolean;
  onSign: (signatureId: string) => void;
  onDecline: (signatureId: string) => void;
  onResend: (signatureId: string) => void;
};

const signatureIcon = (state: ExitSignature["state"]) => {
  if (state === "signed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (state === "rejected" || state === "expired" || state === "revoked") {
    return <XCircle className="w-4 h-4 text-red-400" />;
  }
  if (state === "sent" || state === "viewed") return <Send className="w-4 h-4 text-blue-400" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
};

/** One signer on a clearance section: who, their turn's state, and the actions the backend allows. */
const ExitSignatureRow = ({ signature, busy, onSign, onDecline, onResend }: ExitSignatureRowProps) => {
  const handleSign = useCallback((): void => onSign(signature.id), [onSign, signature.id]);
  const handleDecline = useCallback((): void => onDecline(signature.id), [onDecline, signature.id]);
  const handleResend = useCallback((): void => onResend(signature.id), [onResend, signature.id]);

  const roleKey = EXIT_SIGNER_ROLE_KEYS[signature.signer_role];
  const stateKey = EXIT_SIGNATURE_STATE_KEYS[signature.state];
  const when = signature.decided_at ?? signature.sent_at;

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 p-2 rounded-lg hover:bg-muted/10"
      style={{ fontSize: 13 }}
      data-exit-signature={signature.state}
    >
      {signatureIcon(signature.state)}
      <span className="text-foreground">{roleKey ? arabicSource(roleKey) : signature.signer_role}</span>
      {signature.signer_name && (
        <span className="text-muted-foreground" dir="auto">{signature.signer_name}</span>
      )}
      <span className="text-muted-foreground" style={{ fontSize: 12 }}>
        {stateKey ? arabicSource(stateKey) : signature.state}
        {when && <> · <span dir="ltr">{formatDateTime(when)}</span></>}
      </span>
      <span className="ms-auto flex items-center gap-2">
        {signature.can_sign && (
          <>
            <Button size="sm" variant="success" disabled={busy} onClick={handleSign}>
              {arabicSource("lifecycle.exit_clr_sign")}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={handleDecline}>
              {arabicSource("lifecycle.exit_clr_reject_signature")}
            </Button>
          </>
        )}
        {signature.can_resend && (
          <Button size="sm" variant="outline" icon={Send} disabled={busy} onClick={handleResend}>
            {arabicSource("lifecycle.exit_clr_resend")}
          </Button>
        )}
      </span>
    </div>
  );
};

export default ExitSignatureRow;
