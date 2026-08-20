import { memo } from "react";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { DbJobOpening } from "@/shared/hooks";
import JobCard from "./JobCard";

type RecruitmentJobsViewProps = {
  jobs: DbJobOpening[];
  onAiScreeningOpen: (jobId: string) => void;
  onDeleteJob: (job: DbJobOpening) => void;
  onEditJob: (job: DbJobOpening) => void;
  onJobStatusChange: (job: DbJobOpening, status: string) => void;
  onLinkJob: (job: DbJobOpening) => void;
};

const RecruitmentJobsView = ({
  jobs,
  onAiScreeningOpen,
  onDeleteJob,
  onEditJob,
  onJobStatusChange,
  onLinkJob,
}: RecruitmentJobsViewProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {jobs.length === 0 ? (
      <div className="col-span-full">
        <EmptyState icon={Briefcase} message={arabicSource("recruitment.there_are_no_vacancies_yet")} hint={arabicSource("recruitment.click_new_vacancy_to_add_the_first_job")} className="py-16" />
      </div>
    ) : jobs.map((job, index) => (
      <JobCard
        key={job.id}
        job={job}
        index={index}
        onAiScreeningOpen={onAiScreeningOpen}
        onDeleteJob={onDeleteJob}
        onEditJob={onEditJob}
        onJobStatusChange={onJobStatusChange}
        onLinkJob={onLinkJob}
      />
    ))}
  </div>
);

export default memo(RecruitmentJobsView);
