import { Briefcase, CalendarClock, MapPin } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ApplyLinkInfo } from "@/features/recruitment/api/publicApi";

type PublicApplyJobSummaryProps = {
  job: NonNullable<ApplyLinkInfo["job"]>;
};

export const PublicApplyJobSummary = ({ job }: PublicApplyJobSummaryProps) => (
  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
    <div className="flex items-start gap-2">
      <Briefcase className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
      <div>
        <div className="text-foreground" style={{ fontSize: 16 }}>{job.title}</div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 mt-1" style={{ fontSize: 12 }}>
          {job.department && <span>{job.department}</span>}
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{job.location}
            </span>
          )}
          {job.deadline && (
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {arabicSource("apply.deadline_label")}: <span dir="ltr">{job.deadline}</span>
            </span>
          )}
        </div>
      </div>
    </div>
    {job.description && (
      <p className="text-muted-foreground whitespace-pre-line" style={{ fontSize: 12.5 }}>
        {job.description}
      </p>
    )}
    {Boolean(job.requirements?.length) && (
      <div>
        <div className="text-muted-foreground mb-1.5" style={{ fontSize: 11 }}>
          {arabicSource("apply.requirements_label")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.requirements!.map((requirement, index) => (
            <span key={`${requirement}-${index}`} className="px-2 py-1 rounded-md bg-muted/20 border border-border/40 text-foreground" style={{ fontSize: 11 }}>
              {requirement}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);
