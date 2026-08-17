import { motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbApplicant } from "@/shared/hooks";
import { STAGES, stageColors } from "../constants/recruitment";
import StarRating from "./StarRating";

type RecruitmentPipelineViewProps = {
  applicants: DbApplicant[];
  onSelectApplicant: (applicant: DbApplicant) => void;
};

const RecruitmentPipelineView = ({ applicants, onSelectApplicant }: RecruitmentPipelineViewProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {STAGES.map((stage, stageIndex) => {
      const stageApps = applicants.filter((applicant) => applicant.stage === stage);
      return (
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stageIndex * 0.08 }}
          className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl shadow-lg"
        >
          <div className="p-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-md border ${stageColors[stage]}`} style={{ fontSize: 12 }}>{stage}</span>
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>{stageApps.length}</span>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {stageApps.length > 0 ? stageApps.map((applicant) => (
              <motion.div
                key={applicant.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectApplicant(applicant)}
                className="p-2.5 rounded-lg bg-muted/20 border border-border/20 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-foreground" style={{ fontSize: 12 }}>{applicant.name}</p>
                  {applicant.is_bookmarked && <BookmarkCheck className="w-3 h-3 text-primary" />}
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{applicant.job_title || "—"}</p>
                <div className="mt-1.5">
                  <StarRating value={applicant.rating} size={10} />
                </div>
              </motion.div>
            )) : (
              <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>{arabicSource("recruitment.none")}</p>
            )}
          </div>
        </motion.div>
      );
    })}
  </div>
);

export default RecruitmentPipelineView;
