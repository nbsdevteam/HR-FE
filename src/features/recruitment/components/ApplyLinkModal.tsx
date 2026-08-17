import { useState, useMemo, useCallback, useEffect } from "react";
import {
  X, Loader2, AlertCircle, Link2, Copy, RefreshCw, Check, MessageCircle,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { ModalOverlay } from "@/shared/components";
import { type DbJobOpening, type ApplicationLink } from "@/shared/hooks";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";

const ApplyLinkModal = ({ job, onClose }: { job: DbJobOpening; onClose: () => void }) => {
  const [link, setLink] = useState<ApplicationLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (rotate = false) => {
    setLoading(true);
    setError("");
    try {
      setLink(await odooData.getJobApplyLink(job.id, { rotate }));
    } catch (e: any) {
      setError(e?.message || "");
    }
    setLoading(false);
  }, [job.id]);

  useEffect(() => { void load(); }, [load]);

  // The backend only returns an absolute URL when an SPA origin is configured
  // (candidates on a different host than HR staff). Otherwise it sends a
  // relative path, which we resolve against this app's own origin — so the
  // candidate never receives a link pointing at Odoo.
  const applyUrl = useMemo(() => {
    if (!link) return "";
    if (link.base_url_configured) return link.url;
    return new URL(`/apply/${link.token}`, window.location.origin).toString();
  }, [link]);

  const copy = async () => {
    if (!applyUrl) return;
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the URL is visible and selectable anyway */
    }
  };

  const rotate = async () => {
    if (!localizedConfirm(arabicSource("recruitment.rotate_token_confirm"))) return;
    await load(true);
  };

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg"
    >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />{arabicSource("recruitment.apply_link")}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>{job.title}</p>

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
            <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 break-all text-foreground" style={{ fontSize: 12.5 }} dir="ltr">
              {applyUrl}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={copy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer"
                style={{ fontSize: 13 }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? arabicSource("recruitment.link_copied") : arabicSource("recruitment.copy_link")}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${job.title}\n${applyUrl}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                style={{ fontSize: 13 }}>
                <MessageCircle className="w-4 h-4" />{arabicSource("recruitment.share_whatsapp")}
              </a>
              <button onClick={rotate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
                style={{ fontSize: 13 }}>
                <RefreshCw className="w-4 h-4" />{arabicSource("recruitment.rotate_token")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("recruitment.link_expires")}</label>
                <input type="date" value={link.expires_on || ""} dir="ltr" className={inputCls}
                  onChange={async e => {
                    setLink(await odooData.updateApplicationLink(link.id, { expires_on: e.target.value || false }));
                  }} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 12 }}>{arabicSource("recruitment.link_max_submissions")}</label>
                <input type="number" min={0} value={link.max_submissions} dir="ltr" className={inputCls}
                  onChange={async e => {
                    setLink(await odooData.updateApplicationLink(link.id, {
                      max_submissions: Number(e.target.value) || 0,
                    }));
                  }} />
              </div>
            </div>

            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {arabicSource("recruitment.link_submissions")}: {link.submission_count}
            </p>
          </div>
        )}
    </ModalOverlay>
  );
};

export default ApplyLinkModal;
