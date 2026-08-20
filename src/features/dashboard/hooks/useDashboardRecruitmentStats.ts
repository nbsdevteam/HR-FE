import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { pct } from "../utils/dashboardFormat";

// ═══════ RECRUITMENT KPIs ═══════
export const useDashboardRecruitmentStats = (jobs: any[], applicants: any[]) => {
  const recruitmentStats = useMemo(() => {
    const openPositions = jobs.filter(j => j.status === arabicSource("common.is_open") || j.status === "open" || j.status === arabicSource("common.is_active")).length;
    const closedPositions = jobs.filter(j => j.status === arabicSource("common.closed") || j.status === "closed" || j.status === arabicSource("common.complete")).length;
    const totalApplicants = applicants.length;
    const avgApplicantsPerJob = jobs.length > 0 ? Math.round(totalApplicants / jobs.length) : 0;

    // Pipeline stages
    const stages: Record<string, number> = {};
    applicants.forEach(a => { stages[a.stage] = (stages[a.stage] || 0) + 1; });

    // Time to fill (avg days from job posting to hire)
    const hiredApplicants = applicants.filter(a => a.stage === arabicSource("common.assigned") || a.stage === "hired");
    const avgTimeToFill = (() => {
      if (hiredApplicants.length === 0) return 0;
      const diffs = hiredApplicants.map(a => {
        const applied = new Date(a.applied_date);
        const updated = new Date(a.updated_at);
        return Math.ceil((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(d => d > 0 && d < 365);
      return diffs.length > 0 ? Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length) : 0;
    })();

    // Offer acceptance rate
    const offered = applicants.filter(a => a.stage === arabicSource("common.job_offer") || a.stage === arabicSource("common.assigned") || a.stage === "offered" || a.stage === "hired").length;
    const hired = hiredApplicants.length;
    const offerAcceptRate = offered > 0 ? pct(hired, offered) : 0;

    // Bookmarked candidates (talent pool)
    const bookmarked = applicants.filter(a => a.is_bookmarked).length;

    return {
      openPositions, closedPositions, totalApplicants, avgApplicantsPerJob,
      stages, avgTimeToFill, offerAcceptRate, hired, bookmarked,
    };
  }, [jobs, applicants]);

  // Recruitment pipeline for funnel chart
  const recruitmentPipeline = useMemo(() => {
    const stageOrder = [
      { key: arabicSource("common.introduction"), label: arabicSource("common.introduction"), color: "#3B82F6" },
      { key: arabicSource("common.sort"), label: arabicSource("common.sort"), color: "#8B5CF6" },
      { key: arabicSource("common.interview"), label: arabicSource("common.interview"), color: "#D4AF37" },
      { key: arabicSource("common.test"), label: arabicSource("common.test"), color: "#F97316" },
      { key: arabicSource("common.job_offer"), label: arabicSource("common.job_offer"), color: "#22C55E" },
      { key: arabicSource("common.assigned"), label: arabicSource("common.assigned"), color: "#10B981" },
    ];
    return stageOrder.map(s => ({
      name: s.label,
      value: recruitmentStats.stages[s.key] || 0,
      color: s.color,
    }));
  }, [recruitmentStats.stages]);

  return { recruitmentStats, recruitmentPipeline };
};
