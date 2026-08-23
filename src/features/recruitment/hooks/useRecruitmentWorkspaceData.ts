import { useMemo } from "react";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import { countBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";
import {
  ODOO_TO_GENDER,
  ODOO_TO_JOB_STATUS,
  ODOO_TO_JOB_TYPE,
  ODOO_TO_STAGE,
} from "../constants/recruitment";
import { effectiveScore } from "../utils/recruitmentRanking";

export const useRecruitmentWorkspaceData = (
  rawJobs: DbJobOpening[],
  rawApplicants: DbApplicant[],
  searchTerm: string,
  filterStage: string,
  filterJob: string,
  sortBy: "rank" | "rating" | "date" | "name" | "job" | "stage",
  recSortDir: "asc" | "desc",
) => {
  const jobs = useMemo(
    () =>
      rawJobs.map((j) => ({
        ...j,
        status: ODOO_TO_JOB_STATUS[j.status] || j.status,
        type: ODOO_TO_JOB_TYPE[j.type] || j.type,
      })),
    [rawJobs],
  );
  const applicants = useMemo(
    () =>
      rawApplicants.map((a) => ({
        ...a,
        stage: ODOO_TO_STAGE[a.stage] || a.stage,
        gender: a.gender ? ODOO_TO_GENDER[a.gender] || a.gender : a.gender,
        job_status: a.job_status
          ? ODOO_TO_JOB_STATUS[a.job_status] || a.job_status
          : a.job_status,
      })),
    [rawApplicants],
  );

  const filteredApplicants = useMemo(() => {
    let list = [...applicants];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.email || "").toLowerCase().includes(q) ||
          (a.phone || "").includes(q) ||
          (a.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (a.job_title || "").toLowerCase().includes(q),
      );
    }
    if (filterStage !== arabicSource("common.all"))
      list = list.filter((a) => a.stage === filterStage);
    if (filterJob !== arabicSource("common.all"))
      list = list.filter((a) => a.job_opening_id === filterJob);

    const dir = recSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "rank")
        return dir * (effectiveScore(a) - effectiveScore(b));
      if (sortBy === "rating") return dir * (a.rating - b.rating);
      if (sortBy === "date")
        return (
          dir *
          (new Date(a.applied_date).getTime() -
            new Date(b.applied_date).getTime())
        );
      if (sortBy === "job")
        return dir * (a.job_title || "").localeCompare(b.job_title || "", "ar");
      if (sortBy === "stage")
        return dir * (a.stage || "").localeCompare(b.stage || "", "ar");
      return dir * a.name.localeCompare(b.name, "ar");
    });
    return list;
  }, [applicants, searchTerm, filterStage, filterJob, sortBy, recSortDir]);

  const stats = useMemo(() => {
    const byStage = countBy(applicants, (a) => a.stage);
    let bookmarked = 0;
    for (const applicant of applicants) if (applicant.is_bookmarked) bookmarked += 1;
    return {
      openJobs: jobs.filter((j) => j.status === arabicSource("common.is_open")).length,
      totalApplicants: applicants.length,
      interviewing: byStage.get(arabicSource("common.interview")) ?? 0,
      hired: byStage.get(arabicSource("common.accepted")) ?? 0,
      bookmarked,
    };
  }, [jobs, applicants]);

  return { jobs, applicants, filteredApplicants, stats };
};
