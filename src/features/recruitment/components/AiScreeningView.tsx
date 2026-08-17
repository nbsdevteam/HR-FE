import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Users, Download, Eye, Loader2, Sparkles } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import * as odooData from "@/shared/api/odooData";
import {
  useJobRanking,
  type DbJobOpening, type DbApplicant,
} from "@/shared/hooks";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import {
  ALL_STAGES, stageColors,
} from "../constants/recruitment";
import { hasIr } from "../utils/recruitmentRanking";
import IrBadge from "./IrBadge";

const AiScreeningView = ({ jobs, jobId, setJobId, onSelect, onUpdateStage }: {
  jobs: DbJobOpening[];
  jobId: string | null;
  setJobId: (id: string | null) => void;
  onSelect: (a: DbApplicant) => void;
  onUpdateStage: (id: string, stage: string) => void;
}) => {
  const { items, stats, loading, refetch } = useJobRanking(jobId);
  const [minIr, setMinIr] = useState(0);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => items.filter(a => !hasIr(a) || (a.ir_score || 0) >= minIr),
    [items, minIr],
  );

  const screenAll = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      const result = await odooData.bulkScreenApplicants({ jobOpeningId: jobId, force: false });
      localizedAlert(`${arabicSource("recruitment.queued_for_screening")} (${result.queued})`);
      await refetch();
    } catch (e: any) {
      localizedAlert(e?.message || arabicSource("recruitment.screening_unavailable"));
    }
    setBusy(false);
  };

  const shortlistAbove = async () => {
    const targets = items.filter(a => hasIr(a) && (a.ir_score || 0) >= minIr
      && a.stage === arabicSource("common.introduction"));
    if (targets.length === 0) return;
    setBusy(true);
    for (const applicant of targets) {
      await odooData.updateApplicant(applicant.id, { stage: "screening" });
    }
    await refetch();
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={jobId || ""} onChange={e => setJobId(e.target.value || null)}
          className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer min-w-[220px]"
          style={{ fontSize: 13 }}>
          <option value="">{arabicSource("recruitment.select_job_first")}</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
        {jobId && (
          <>
            <button onClick={screenAll} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 13 }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {arabicSource("recruitment.screen_all")}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("recruitment.min_ir_filter")}
              </span>
              <input type="range" min={0} max={95} step={5} value={minIr}
                onChange={e => setMinIr(Number(e.target.value))}
                className="cursor-pointer accent-current text-primary" dir="ltr" />
              <span className="text-foreground" style={{ fontSize: 12 }} dir="ltr">{minIr}%</span>
            </div>
            {minIr > 0 && (
              <button onClick={shortlistAbove} disabled={busy}
                className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontSize: 13 }}>
                {arabicSource("recruitment.shortlist_above")}
              </button>
            )}
          </>
        )}
      </div>

      {!jobId ? (
        <EmptyState icon={Sparkles} message={arabicSource("recruitment.select_job_first")} className="py-16" />
      ) : loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: arabicSource("common.total_applicants"), value: stats.total },
                { label: arabicSource("recruitment.screened_count"), value: stats.screened },
                { label: arabicSource("recruitment.ir_pending"), value: stats.pending },
                { label: arabicSource("recruitment.average_ir"), value: `${stats.average_ir}%` },
              ].map(stat => (
                <div key={stat.label} className="bg-card/30 border border-border/40 rounded-xl p-4">
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                  <span className="text-gradient-gold block mt-1" style={{ fontSize: 22 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {stats && stats.pending > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 text-primary" style={{ fontSize: 12.5 }}>
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {arabicSource("recruitment.ir_processing")} — {stats.pending}
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState icon={Users} message={arabicSource("recruitment.there_are_no_applicants")} className="py-12" />
          ) : (
            <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}>{arabicSource("recruitment.rank_label")}</th>
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}>{arabicSource("recruitment.advanced")}</th>
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}>{arabicSource("recruitment.ir_score")}</th>
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}>{arabicSource("recruitment.matched_skills")}</th>
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}>{arabicSource("common.stage")}</th>
                      <th className="px-4 py-3 text-start" style={{ fontSize: 12 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((app, i) => (
                      <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          {app.rank ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                              app.rank <= 3 ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground"
                            }`} style={{ fontSize: 12 }} dir="ltr">
                              {app.rank}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => onSelect(app)}
                            className="text-start cursor-pointer hover:text-primary transition-colors">
                            <span className="text-foreground block">{app.name}</span>
                            {app.email && <span className="text-muted-foreground block" style={{ fontSize: 11 }} dir="ltr">{app.email}</span>}
                          </button>
                        </td>
                        <td className="px-4 py-3"><IrBadge applicant={app} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {(app.matched_skills || []).slice(0, 3).map((skill, si) => (
                              <span key={si} className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" style={{ fontSize: 10 }}>
                                {skill}
                              </span>
                            ))}
                            {(app.matched_skills?.length || 0) > 3 && (
                              <span className="px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground" style={{ fontSize: 10 }}>
                                +{(app.matched_skills?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select value={app.stage}
                            onChange={e => onUpdateStage(app.id, e.target.value)}
                            className={`px-2 py-0.5 rounded-md border cursor-pointer bg-transparent ${stageColors[app.stage] || ""}`}
                            style={{ fontSize: 12 }}>
                            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {app.resume_url && (
                              <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-primary/10 text-primary" title={arabicSource("recruitment.download_cv_2")}>
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => onSelect(app)}
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground cursor-pointer"
                              title={arabicSource("common.show_details")}>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AiScreeningView;
