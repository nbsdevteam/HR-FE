import { memo } from "react";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import NodeAvatar from "@/shared/components/NodeAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { stageColors } from "../constants/recruitment";
import { effectiveScore, hasIr, rankLabel } from "../utils/recruitmentRanking";
import StarRating from "./StarRating";

type CandidateCardProps = {
  app: DbApplicant;
  index: number;
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
};

const CandidateCard = ({ app, index, onSelect, onToggleBookmark, onUpdateRating }: CandidateCardProps) => {
  const score = effectiveScore(app);
  const rank = rankLabel(score, app.ir_band);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      onClick={() => onSelect(app)}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg hover:border-primary/40 transition-all cursor-pointer relative"
    >
      <div className="absolute top-3 start-3 flex items-center gap-1">
        <StatusBadge colorClassName={rank.color} fontSize={11}>{score}%</StatusBadge>
        {hasIr(app) && <Sparkles className="w-3 h-3 text-primary" />}
      </div>
      <div className="absolute top-3 end-3">
        <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(app); }}
          className="p-1 rounded hover:bg-primary/10 cursor-pointer">
          {app.is_bookmarked
            ? <BookmarkCheck className="w-4 h-4 text-primary" />
            : <Bookmark className="w-4 h-4 text-muted-foreground/30" />}
        </button>
      </div>

      <div className="flex flex-col items-center pt-6 pb-3">
        <NodeAvatar
          name={app.name}
          initials={app.name.charAt(0)}
          sizeClassName="w-14 h-14 mb-2"
          fontSize={20}
          extraClassName="bg-primary/20 border-2 border-primary/30"
          textClassName="text-primary"
        />
        <h4 className="text-foreground">{app.name}</h4>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{app.job_title || "—"}</p>
        <div className="mt-2">
          <StarRating value={app.rating} onChange={(r) => { onUpdateRating(app.id, r); }} size={14} />
        </div>
      </div>

      <div className="border-t border-border/20 pt-3 space-y-2">
        {app.experience_years > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{app.experience_years} {arabicSource("recruitment.years_of_experience")}</span>
            {app.current_company && <span>— {app.current_company}</span>}
          </div>
        )}
        {app.education && (
          <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" /> {app.education}
          </div>
        )}
        {app.skills && app.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {app.skills.slice(0, 4).map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary" style={{ fontSize: 10 }}>{s}</span>
            ))}
            {app.skills.length > 4 && (
              <span className="px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground" style={{ fontSize: 10 }}>+{app.skills.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
        <StatusBadge colorClassName={stageColors[app.stage] || ""} fontSize={11}>{app.stage}</StatusBadge>
        <StatusBadge colorClassName={rank.color} fontSize={11}>{rank.text}</StatusBadge>
      </div>
    </motion.div>
  );
};

export default memo(CandidateCard);
