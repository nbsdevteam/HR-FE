import { memo } from "react";
import { motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { type DbApplicant } from "@/shared/hooks";
import StarRating from "./StarRating";

type PipelineCardProps = {
  applicant: DbApplicant;
  onSelect: (applicant: DbApplicant) => void;
};

const PipelineCard = ({ applicant, onSelect }: PipelineCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={() => onSelect(applicant)}
    className="p-2.5 rounded-lg bg-muted/20 border border-border/20 cursor-pointer hover:border-primary/30 transition-all"
  >
    <div className="flex items-center justify-between mb-1">
      <p className="text-foreground" style={{ fontSize: 12 }}>
        {applicant.name}
      </p>
      {applicant.is_bookmarked && (
        <BookmarkCheck className="w-3 h-3 text-primary" />
      )}
    </div>
    <p className="text-muted-foreground" style={{ fontSize: 10 }}>
      {applicant.job_title || "—"}
    </p>
    <div className="mt-1.5">
      <StarRating value={applicant.rating} size={10} />
    </div>
  </motion.div>
);

export default memo(PipelineCard);
