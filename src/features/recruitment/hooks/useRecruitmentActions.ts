import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import {
  GENDER_TO_ODOO,
  JOB_STATUS_TO_ODOO,
  STAGE_TO_ODOO,
} from "../constants/recruitment";

type ApplicantRollbackContext = { previousApplicants?: DbApplicant[] };

export const useRecruitmentActions = (
  refetchJobs: () => void,
  refetchApps: () => void,
  setSelectedApplicant: Dispatch<SetStateAction<DbApplicant | null>>,
) => {
  const queryClient = useQueryClient();

  const applyOptimisticApplicantPatch = useCallback(
    (id: string, patch: Partial<DbApplicant>): ApplicantRollbackContext => {
      const previousApplicants = queryClient.getQueryData<DbApplicant[]>(["applicants"]);
      queryClient.setQueryData<DbApplicant[]>(["applicants"], (old) =>
        old?.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
      return { previousApplicants };
    },
    [queryClient],
  );

  const rollbackApplicants = useCallback(
    (context: ApplicantRollbackContext | undefined) => {
      if (context?.previousApplicants) {
        queryClient.setQueryData(["applicants"], context.previousApplicants);
      }
    },
    [queryClient],
  );

  const toggleBookmarkMutation = useOdooMutation<unknown, DbApplicant>(
    (app) => odooData.updateApplicant(app.id, { is_bookmarked: !app.is_bookmarked }),
    "applicants",
  );
  const updateRatingMutation = useOdooMutation<
    unknown,
    { id: string; rating: number },
    ApplicantRollbackContext
  >(
    (vars) => odooData.updateApplicant(vars.id, { rating: vars.rating }),
    "applicants",
    {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ["applicants"] });
        return applyOptimisticApplicantPatch(vars.id, { rating: vars.rating });
      },
      onError: (_err, _vars, context) => rollbackApplicants(context),
    },
  );
  const updateStageMutation = useOdooMutation<
    unknown,
    { id: string; stage: string },
    ApplicantRollbackContext
  >(
    (vars) =>
      odooData.updateApplicant(vars.id, {
        stage: STAGE_TO_ODOO[vars.stage] || vars.stage,
      }),
    ["applicants", "jobOpenings"],
    {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ["applicants"] });
        return applyOptimisticApplicantPatch(vars.id, { stage: vars.stage });
      },
      onError: (_err, _vars, context) => rollbackApplicants(context),
    },
  );
  const screenApplicantMutation = useOdooMutation<DbApplicant, DbApplicant>(
    (app) => odooData.screenApplicant(app.id, { force: true }),
    "applicants",
  );
  const jobStatusMutation = useOdooMutation<
    unknown,
    { job: DbJobOpening; nextStatus: string }
  >(
    (vars) =>
      odooData.updateJobOpening(vars.job.id, {
        status: JOB_STATUS_TO_ODOO[vars.nextStatus] || vars.nextStatus,
      }),
    "jobOpenings",
  );
  const deleteJobMutation = useOdooMutation<unknown, DbJobOpening>(
    (job) => odooData.deleteJobOpening(job.id),
    "jobOpenings",
  );
  const deleteApplicantMutation = useOdooMutation<unknown, string>(
    (id) => odooData.deleteApplicant(id),
    "applicants",
  );
  const convertToEmployeeMutation = useOdooMutation<void, DbApplicant>(
    async (app) => {
      const depts = await odooData.fetchDepartments();
      const dept = depts.find((d) => d.name === app.job_department);
      await odooData.createEmployee({
        name: app.name,
        email: app.email || undefined,
        phone: app.phone || undefined,
        department_id: dept?.id || undefined,
        gender: app.gender ? GENDER_TO_ODOO[app.gender] || app.gender : undefined,
        monthly_salary: app.expected_salary || undefined,
        status: "active",
      });
      await odooData.updateApplicant(app.id, {
        stage: "hired",
        notes: (app.notes || "") + "\n[تم التحويل لموظف]",
      });
    },
    ["employees", "applicants", "jobOpenings"],
  );

  const handleToggleBookmark = useCallback(
    async (app: DbApplicant) => {
      await toggleBookmarkMutation.mutateAsync(app);
    },
    [toggleBookmarkMutation],
  );
  const handleUpdateRating = useCallback(
    async (id: string, rating: number) => {
      await updateRatingMutation.mutateAsync({ id, rating });
    },
    [updateRatingMutation],
  );
  const handleUpdateStage = useCallback(
    async (id: string, stage: string) => {
      await updateStageMutation.mutateAsync({ id, stage });
    },
    [updateStageMutation],
  );
  const handleScreenApplicant = useCallback(
    async (app: DbApplicant) => {
      if (!app.resume_url) {
        localizedAlert(arabicSource("recruitment.no_resume_for_screening"));
        return;
      }
      try {
        await screenApplicantMutation.mutateAsync(app);
      } catch (e: any) {
        localizedAlert(
          e?.message || arabicSource("recruitment.screening_unavailable"),
        );
      }
    },
    [screenApplicantMutation],
  );
  const handleJobStatusChange = useCallback(
    async (job: DbJobOpening, nextStatus: string) => {
      if (nextStatus === job.status) return;
      try {
        await jobStatusMutation.mutateAsync({ job, nextStatus });
      } catch (e: any) {
        localizedAlert(e?.message || arabicSource("common.error"));
      }
    },
    [jobStatusMutation],
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
        await deleteJobMutation.mutateAsync(job);
      } catch (e: any) {
        localizedAlert(e?.message || arabicSource("common.error"));
      }
    },
    [deleteJobMutation],
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
      await deleteApplicantMutation.mutateAsync(id);
      setSelectedApplicant(null);
    },
    [deleteApplicantMutation, setSelectedApplicant],
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
        await convertToEmployeeMutation.mutateAsync(app);
        setSelectedApplicant(null);
        localizedAlert(`تم إضافة "${app.name}" كموظف بنجاح!`);
      } catch (e: any) {
        localizedAlert("خطأ في تحويل المتقدم: " + e.message);
      }
    },
    [convertToEmployeeMutation, setSelectedApplicant],
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
