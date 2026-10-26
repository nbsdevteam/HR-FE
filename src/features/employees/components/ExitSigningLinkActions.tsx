import { useCallback, useState } from "react";
import { Copy, ExternalLink, KeyRound, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ExitSigningLink } from "@/shared/hooks";

type ExitSigningLinkActionsProps = {
  signature: ExitSigningLink;
  /** `hr.lifecycle.edit` — may issue a replacement link. */
  canIssue: boolean;
  busy: boolean;
  onIssue: () => void;
};

/**
 * The full link to share: the server's absolute `url`, or this site's origin plus
 * the `path` when the server has no public base URL configured.
 */
export const signingLinkUrl = (signature: ExitSigningLink): string =>
  signature.url || (signature.path ? `${window.location.origin}${signature.path}` : "");

/** `wa.me` with the link as text; HR sends it from their own phone — the backend sends no WhatsApp. */
export const whatsappShareUrl = (link: string): string => `https://wa.me/?text=${encodeURIComponent(link)}`;

/**
 * Copy / WhatsApp / open here for HR, only while the backend sent the link
 * (`path`, HR with `hr.lifecycle.edit` while the link is open). The link is a
 * credential — it is never shown without that.
 */
const ExitSigningLinkActions = ({ signature, canIssue, busy, onIssue }: ExitSigningLinkActionsProps) => {
  const [copied, setCopied] = useState(false);
  const link = signingLinkUrl(signature);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [link]);

  const handleWhatsapp = useCallback((): void => {
    window.open(whatsappShareUrl(link), "_blank", "noopener,noreferrer");
  }, [link]);

  const handleOpenHere = useCallback((): void => {
    if (signature.path) window.location.assign(signature.path);
  }, [signature.path]);

  return (
    <div className="space-y-2" data-exit-signing-link>
      {link && (
        <>
          <p className="flex items-center gap-1.5 text-amber-400" style={{ fontSize: 12 }}>
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            {arabicSource("lifecycle.exit_signing_link_warning")}
          </p>
          <input readOnly value={link} dir="ltr" className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground" style={{ fontSize: 12 }} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={Copy} onClick={handleCopy} data-exit-signing-copy>
              {copied ? arabicSource("public_leave.copied") : arabicSource("settings.leave_links_copy_link")}
            </Button>
            <Button variant="outline" size="sm" icon={MessageCircle} onClick={handleWhatsapp}>
              {arabicSource("recruitment.share_whatsapp")}
            </Button>
            <Button variant="outline" size="sm" icon={ExternalLink} onClick={handleOpenHere}>
              {arabicSource("lifecycle.exit_signing_open_here")}
            </Button>
          </div>
        </>
      )}
      {canIssue && (
        <Button variant="outline" size="sm" icon={RefreshCw} disabled={busy} onClick={onIssue} data-exit-signing-issue>
          {arabicSource("lifecycle.exit_signing_issue")}
        </Button>
      )}
    </div>
  );
};

export default ExitSigningLinkActions;
