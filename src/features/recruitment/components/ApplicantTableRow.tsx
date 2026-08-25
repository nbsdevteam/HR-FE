import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck, Download, Eye } from "lucide-react";
import { Button } from "@/shared/components";
import NodeAvatar from "@/shared/components/NodeAvatar";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { handleDownloadResume } from "../utils/resumeDownload";
import IrBadge from "./IrBadge";
import StageSelect from "./StageSelect";
import StarRating from "./StarRating";

type ApplicantTableRowProps = {
  app: DbApplicant;
  index: number;
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
  onUpdateStage: (id: string, s: string) => void;
};

const ApplicantTableRow = ({ app, index, onSelect, onToggleBookmark, onUpdateRating, onUpdateStage }: ApplicantTableRowProps) => {
  const handleToggleBookmark = useCallback(() => onToggleBookmark(app), [onToggleBookmark, app]);
  const handleSelect = useCallback(() => onSelect(app), [onSelect, app]);
  const handleStageChange = useCallback((stage: string) => onUpdateStage(app.id, stage), [onUpdateStage, app.id]);
  const handleRatingChange = useCallback((r: number) => onUpdateRating(app.id, r), [onUpdateRating, app.id]);
  const handleDownloadResumeClick = useCallback(() => {
    void handleDownloadResume(app.id);
  }, [app.id]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-3 py-3">
        <Button
          onClick={handleToggleBookmark}
          variant="unstyled"
          size="unstyled"
          rounded="rounded"
          className="p-1 hover:bg-primary/10"
        >
          {app.is_bookmarked
            ? <BookmarkCheck className="w-4 h-4 text-primary" />
            : <Bookmark className="w-4 h-4 text-muted-foreground/40" />}
        </Button>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleSelect} className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
          <NodeAvatar
            name={app.name}
            initials={app.name.charAt(0)}
            sizeClassName="w-8 h-8 flex-shrink-0"
            fontSize={12}
            extraClassName="bg-primary/20 border border-primary/30"
            textClassName="text-primary"
          />
          <div className="text-start">
            <span className="text-foreground block">{app.name}</span>
            {app.email && <span className="text-muted-foreground block" style={{ fontSize: 11 }} dir="ltr">{app.email}</span>}
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{app.job_title || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{app.applied_date}</td>
      <td className="px-4 py-3">
        <StageSelect stage={app.stage} onChange={handleStageChange} />
      </td>
      <td className="px-4 py-3">
        <StarRating value={app.rating} onChange={handleRatingChange} size={12} />
      </td>
      <td className="px-4 py-3">
        <IrBadge applicant={app} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {app.resume_url && (
            <Button
              type="button"
              onClick={handleDownloadResumeClick}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              className="p-1 hover:bg-primary/10 text-primary"
              icon={Download}
              iconClassName="w-3.5 h-3.5"
              title={arabicSource("recruitment.download_cv_2")}
            />
          )}
          <Button
            onClick={handleSelect}
            variant="unstyled"
            size="unstyled"
            rounded="rounded"
            className="p-1 hover:bg-primary/10 text-muted-foreground"
            icon={Eye}
            iconClassName="w-3.5 h-3.5"
            title={arabicSource("common.show_details")}
          />
        </div>
      </td>
    </motion.tr>
  );
};

export default memo(ApplicantTableRow);
