import { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  Loader2,
  AlertCircle,
  Link2,
  Copy,
  RefreshCw,
  Check,
  MessageCircle,
  Linkedin,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import {
  Button,
  InputField,
  ModalFooterActions,
  ModalHeader,
  ModalOverlay,
} from "@/shared/components";
import { type DbJobOpening, type ApplicationLink } from "@/shared/hooks";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";

const ApplyLinkModal = ({
  job,
  onClose,
}: {
  job: DbJobOpening;
  onClose: () => void;
}) => {
  const [link, setLink] = useState<ApplicationLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingExpiresOn, setPendingExpiresOn] = useState("");
  const [pendingMaxSubmissions, setPendingMaxSubmissions] = useState(0);

  // The backend only returns an absolute URL when an SPA origin is configured
  // (candidates on a different host than HR staff). Otherwise it sends a
  // relative path, which we resolve against this app's own origin — so the
  // candidate never receives a link pointing at Odoo.
  const applyUrl = useMemo(() => {
    if (!link) return "";
    if (link.base_url_configured) return link.url;
    return new URL(`/apply/${link.token}`, window.location.origin).toString();
  }, [link]);

  const isDirty = useMemo(() => {
    if (!link) return false;
    return (
      pendingExpiresOn !== (link.expires_on || "") ||
      pendingMaxSubmissions !== link.max_submissions
    );
  }, [link, pendingExpiresOn, pendingMaxSubmissions]);

  const load = useCallback(
    async (rotate = false) => {
      setLoading(true);
      setError("");
      try {
        setLink(await odooData.getJobApplyLink(job.id, { rotate }));
      } catch (e: any) {
        setError(e?.message || "");
      }
      setLoading(false);
    },
    [job.id],
  );

  const copy = useCallback(async () => {
    if (!applyUrl) return;
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the URL is visible and selectable anyway */
    }
  }, [applyUrl]);

  const rotate = useCallback(async () => {
    if (!localizedConfirm(arabicSource("recruitment.rotate_token_confirm")))
      return;
    await load(true);
  }, [load]);

  const handleExpiresOnChange = useCallback((value: string): void => {
    setPendingExpiresOn(value);
  }, []);

  const handleMaxSubmissionsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setPendingMaxSubmissions(Number(e.target.value) || 0);
    },
    [],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!link) return;
    setSaving(true);
    setError("");
    try {
      setLink(
        await odooData.updateApplicationLink(link.id, {
          expires_on: pendingExpiresOn || false,
          max_submissions: pendingMaxSubmissions,
        }),
      );
    } catch (e: any) {
      setError(e?.message || "");
    }
    setSaving(false);
  }, [link, pendingExpiresOn, pendingMaxSubmissions]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!link) return;
    setPendingExpiresOn(link.expires_on || "");
    setPendingMaxSubmissions(link.max_submissions);
  }, [link]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg"
    >
      <ModalHeader
        title={
          <span className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            {arabicSource("recruitment.apply_link")}
          </span>
        }
        onClose={onClose}
        className="flex items-center justify-between mb-5"
      />

      <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
        {job.title}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : error || !link ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontSize: 12.5 }}>{error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="rounded-lg border border-border bg-muted/10 px-4 py-3 break-all text-foreground"
            style={{ fontSize: 12.5 }}
            dir="ltr"
          >
            {applyUrl}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={copy}
              icon={copied ? Check : Copy}
              className="cursor-pointer"
              style={{ fontSize: 13 }}
            >
              {copied
                ? arabicSource("recruitment.link_copied")
                : arabicSource("recruitment.copy_link")}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${job.title}\n${applyUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              style={{ fontSize: 13 }}
            >
              <MessageCircle className="w-4 h-4" />
              {arabicSource("recruitment.share_whatsapp")}
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(applyUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 transition-colors"
              style={{ fontSize: 13 }}
            >
              <Linkedin className="w-4 h-4" />
              {arabicSource("recruitment.share_linkedin")}
            </a>
            <Button
              variant="ghost"
              onClick={rotate}
              icon={RefreshCw}
              className="border border-border cursor-pointer"
              style={{ fontSize: 13 }}
            >
              {arabicSource("recruitment.rotate_token")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontSize: 12 }}>
                {arabicSource("recruitment.link_expires")}
              </label>
              <InputField
                type="date"
                value={pendingExpiresOn}
                dir="ltr"
                className={inputCls}
                onChange={handleExpiresOnChange}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 12 }}>
                {arabicSource("recruitment.link_max_submissions")}
              </label>
              <input
                type="number"
                min={0}
                value={pendingMaxSubmissions}
                dir="ltr"
                className={inputCls}
                onChange={handleMaxSubmissionsChange}
              />
            </div>
          </div>

          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("recruitment.link_submissions")}:{" "}
            {link.submission_count}
          </p>

          <ModalFooterActions
            onCancel={onClose}
            onConfirm={handleSave}
            confirmLabel={arabicSource("common.save")}
            disabled={!isDirty || saving}
            loading={saving}
            cancelDisabled={saving}
            wrapperClassName="flex items-center justify-end gap-3 pt-2"
          />
        </div>
      )}
    </ModalOverlay>
  );
};

export default memo(ApplyLinkModal);
