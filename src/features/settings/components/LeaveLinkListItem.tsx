import { memo, useCallback, useMemo, useState } from "react";
import { Check, Copy, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { DbLeaveLink } from "@/shared/hooks";

type LeaveLinkListItemProps = {
  link: DbLeaveLink;
  onDelete: (link: DbLeaveLink) => void;
  onEdit: (link: DbLeaveLink) => void;
  onRotate: (link: DbLeaveLink) => void;
};

const VERIFICATION_LABEL_KEYS: Record<DbLeaveLink["require_verification"], ArabicSourceKey> = {
  none: "settings.leave_links_verification_none",
  employee_code: "settings.leave_links_verification_employee_code",
  birthday: "settings.leave_links_verification_birthday",
  phone_last4: "settings.leave_links_verification_phone_last4",
};

const LeaveLinkListItem = ({ link, onDelete, onEdit, onRotate }: LeaveLinkListItemProps) => {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (link.base_url_configured) return link.url;
    if (typeof window === "undefined") return link.url;
    return new URL(`/leave-request/${link.token}`, window.location.origin).toString();
  }, [link.base_url_configured, link.token, link.url]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the URL is visible and selectable anyway */
    }
  }, [url]);

  const handleEdit = useCallback((): void => {
    onEdit(link);
  }, [link, onEdit]);

  const handleDelete = useCallback((): void => {
    onDelete(link);
  }, [link, onDelete]);

  const handleRotate = useCallback((): void => {
    onRotate(link);
  }, [link, onRotate]);

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground text-sm truncate">{link.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5 truncate" dir="ltr">{url}</p>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${
            link.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/30 text-muted-foreground"
          }`}
        >
          {arabicSource(link.active ? "common.is_active" : "common.is_inactive")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
        <span>
          {arabicSource("settings.leave_links_submissions_label")}: {link.submission_count}
          {link.max_submissions > 0 ? ` / ${link.max_submissions}` : ` (${arabicSource("settings.leave_links_unlimited")})`}
        </span>
        <span>
          {arabicSource("settings.leave_links_expires_label")}: {link.expires_on || arabicSource("settings.leave_links_no_expiry")}
        </span>
        <span>
          {arabicSource("settings.leave_links_verification_label")}: {arabicSource(VERIFICATION_LABEL_KEYS[link.require_verification])}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleCopy}
          icon={copied ? Check : Copy}
          className="px-3 py-1.5 border border-border cursor-pointer"
          style={{ fontSize: 12 }}
        >
          {copied ? arabicSource("settings.leave_links_link_copied") : arabicSource("settings.leave_links_copy_link")}
        </Button>
        <Button
          variant="ghost"
          onClick={handleEdit}
          icon={Pencil}
          className="px-3 py-1.5 border border-border cursor-pointer"
          style={{ fontSize: 12 }}
        >
          {arabicSource("common.edit")}
        </Button>
        <Button
          variant="ghost"
          onClick={handleRotate}
          icon={RefreshCw}
          className="px-3 py-1.5 border border-border cursor-pointer"
          style={{ fontSize: 12 }}
        >
          {arabicSource("settings.leave_links_rotate")}
        </Button>
        <Button
          variant="unstyled"
          size="unstyled"
          rounded="rounded"
          onClick={handleDelete}
          className="gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 cursor-pointer"
          style={{ fontSize: 12 }}
        >
          <Trash2 className="w-4 h-4" />
          {arabicSource("common.delete")}
        </Button>
      </div>
    </div>
  );
};

export default memo(LeaveLinkListItem);
