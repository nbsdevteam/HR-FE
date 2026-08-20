import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import {
  GENDER_TO_ODOO,
  JOB_STATUS_TO_ODOO,
  STAGE_TO_ODOO,
} from "../constants/recruitment";

export const useRecruitmentActions = (
  refetchJobs: () => void,
  refetchApps: () => void,
  setSelectedApplicant: Dispatch<SetStateAction<DbApplicant | null>>,
) => {
  const handleToggleBookmark = useCallback(
    async (app: DbApplicant) => {
      await odooData.updateApplicant(app.id, {
        is_bookmarked: !app.is_bookmarked,
      });
      refetchApps();
    },
    [refetchApps],
  );
  const handleUpdateRating = useCallback(
    async (id: string, rating: number) => {
      await odooData.updateApplicant(id, { rating });
      refetchApps();
    },
    [refetchApps],
  );
  const handleUpdateStage = useCallback(
    async (id: string, stage: string) => {
      await odooData.updateApplicant(id, {
        stage: STAGE_TO_ODOO[stage] || stage,
      });
      refetchApps();
    },
    [refetchApps],
  );
  const handleScreenApplicant = useCallback(
    async (app: DbApplicant) => {
      if (!app.resume_url) {
        localizedAlert(arabicSource("recruitment.no_resume_for_screening"));
        return;
      }
      try {
        await odooData.screenApplicant(app.id, { force: true });
        refetchApps();
      } catch (e: any) {
        localizedAlert(
          e?.message || arabicSource("recruitment.screening_unavailable"),
        );
      }
    },
    [refetchApps],
  );
  const handleJobStatusChange = useCallback(
    async (job: DbJobOpening, nextStatus: string) => {
      if (nextStatus === job.status) return;
      try {
        await odooData.updateJobOpening(job.id, {
          status: JOB_STATUS_TO_ODOO[nextStatus] || nextStatus,
        });
        refetchJobs();
      } catch (e: any) {
        localizedAlert(e?.message || arabicSource("common.error"));
      }
    },
    [refetchJobs],
  );

  const handleDeleteJob = useCallback(
    async (job: DbJobOpening) => {
      if (
        !localizedConfirm(
          arabicSource(
            "recruitment.are_you_sure_you_want_to_delete_this_vacancy",
          ),
        )
      )
        return;
      try {
        await odooData.deleteJobOpening(job.id);
        refetchJobs();
      } catch (e: any) {
        localizedAlert(e?.message || arabicSource("common.error"));
      }
    },
    [refetchJobs],
  );

  const handleDeleteApplicant = useCallback(
    async (id: string) => {
      if (
        !localizedConfirm(
          arabicSource(
            "recruitment.are_you_sure_you_want_to_delete_this_applicant",
          ),
        )
      )
        return;
      await odooData.deleteApplicant(id);
      setSelectedApplicant(null);
      refetchApps();
    },
    [refetchApps],
  );

  const handleConvertToEmployee = useCallback(
    async (app: DbApplicant) => {
      if (
        !localizedConfirm(
          `${arabicSource("recruitment.do_you_want_to_convert")}${app.name}${arabicSource("recruitment.to_an_employee_in_the_system")}`,
        )
      )
        return;

      try {
        const depts = await odooData.fetchDepartments();
        const dept = depts.find((d) => d.name === app.job_department);
        await odooData.createEmployee({
          name: app.name,
          email: app.email || undefined,
          phone: app.phone || undefined,
          department_id: dept?.id || undefined,
          gender: app.gender
            ? GENDER_TO_ODOO[app.gender] || app.gender
            : undefined,
          monthly_salary: app.expected_salary || undefined,
          status: "active",
        });
        await odooData.updateApplicant(app.id, {
          stage: "hired",
          notes: (app.notes || "") + "\n[تم التحويل لموظف]",
        });
        setSelectedApplicant(null);
        refetchApps();
        alert(`تم إضافة "${app.name}" كموظف بنجاح!`);
      } catch (e: any) {
        alert("خطأ في تحويل المتقدم: " + e.message);
      }
    },
    [refetchApps],
  );

  return {
    handleToggleBookmark,
    handleUpdateRating,
    handleUpdateStage,
    handleScreenApplicant,
    handleJobStatusChange,
    handleDeleteJob,
    handleDeleteApplicant,
    handleConvertToEmployee,
  };
};
