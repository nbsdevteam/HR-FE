import { memo } from "react";
import { motion } from "motion/react";
import {
  Briefcase,
  Clock,
  Edit3,
  Link2,
  MapPin,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbJobOpening } from "@/shared/hooks";
import { JOB_STATUSES, statusColors } from "../constants/recruitment";
import Chip from "./Chip";
import RequirementOverflowBadge from "./RequirementOverflowBadge";

interface IJobCardProps {
  job: DbJobOpening;
  index: number;
  onAiScreeningOpen: (jobId: string) => void;
  onDeleteJob: (job: DbJobOpening) => void;
  onEditJob: (job: DbJobOpening) => void;
  onJobStatusChange: (job: DbJobOpening, status: string) => void;
  onLinkJob: (job: DbJobOpening) => void;
}

const JobCard = ({
  job,
  index,
  onAiScreeningOpen,
  onDeleteJob,
  onEditJob,
  onJobStatusChange,
  onLinkJob,
}: IJobCardProps) => {
  const handleStatusChange = (value: string): void => {
    onJobStatusChange(job, value);
  };
  const handleLinkClick = (): void => {
    onLinkJob(job);
  };
  const handleAiScreeningClick = (): void => {
    onAiScreeningOpen(job.id);
  };
  const handleEditClick = (): void => {
    onEditJob(job);
  };
  const handleDeleteClick = (): void => {
    onDeleteJob(job);
  };

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -3 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-foreground">{job.title}</h3>
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>
          {job.department}
        </p>
      </div>
      <Select
        value={job.status}
        onChange={handleStatusChange}
        options={JOB_STATUSES}
        title={arabicSource("recruitment.vacancy_status")}
        className={`px-2 py-0.5 rounded-md border bg-transparent cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 ${statusColors[job.status] || ""}`}
        style={{ fontSize: 12 }}
      />
    </div>
    <div className="flex flex-wrap gap-3 mb-3">
      <span
        className="flex items-center gap-1 text-muted-foreground"
        style={{ fontSize: 12 }}
      >
        <MapPin className="w-3.5 h-3.5" />
        {job.location}
      </span>
      <span
        className="flex items-center gap-1 text-muted-foreground"
        style={{ fontSize: 12 }}
      >
        <Briefcase className="w-3.5 h-3.5" />
        {job.type}
      </span>
      <span
        className="flex items-center gap-1 text-muted-foreground"
        style={{ fontSize: 12 }}
      >
        <Users className="w-3.5 h-3.5" />
        {job.applicant_count || 0} {arabicSource("recruitment.advanced_2")}
      </span>
      {job.deadline && (
        <span
          className="flex items-center gap-1 text-muted-foreground"
          style={{ fontSize: 12 }}
        >
          <Clock className="w-3.5 h-3.5" />
          <span dir="ltr">{job.deadline}</span>
        </span>
      )}
    </div>
    {job.requirements && job.requirements.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {job.requirements.slice(0, 2).map((requirement, requirementIndex) => (
          <Chip
            key={`${requirement}-${requirementIndex}`}
            label={requirement}
            variant="requirement"
          />
        ))}
        <RequirementOverflowBadge hiddenCount={job.requirements.length - 2} />
      </div>
    )}
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/20">
      <button
        onClick={handleLinkClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
        style={{ fontSize: 12 }}
      >
        <Link2 className="w-3.5 h-3.5" />
        {arabicSource("recruitment.apply_link")}
      </button>
      <button
        onClick={handleAiScreeningClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
        style={{ fontSize: 12 }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {arabicSource("recruitment.ai_tab")}
      </button>
      <div className="flex items-center gap-1 ms-auto">
        <button
          onClick={handleEditClick}
          title={arabicSource("common.edit")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDeleteClick}
          title={arabicSource("common.delete")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </motion.div>
  );
};

export default memo(JobCard);
