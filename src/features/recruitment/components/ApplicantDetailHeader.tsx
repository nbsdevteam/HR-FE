import { memo, useCallback } from "react";
import { Bookmark, BookmarkCheck, Edit3, Trash2, X } from "lucide-react";
import NodeAvatar from "@/shared/components/NodeAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import StarRating from "./StarRating";

type ApplicantDetailHeaderProps = {
  applicant: DbApplicant;
  score: number;
  rankColor: string;
  rankText: string;
  onRatingChange: (r: number) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onEdit: (a: DbApplicant) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

const ApplicantDetailHeader = ({
  applicant, score, rankColor, rankText, onRatingChange, onToggleBookmark, onEdit, onDelete, onClose,
}: ApplicantDetailHeaderProps) => {
  const handleToggleBookmark = useCallback(() => onToggleBookmark(applicant), [onToggleBookmark, applicant]);
  const handleEdit = useCallback(() => onEdit(applicant), [onEdit, applicant]);
  const handleDelete = useCallback(() => onDelete(applicant.id), [onDelete, applicant.id]);

  return (
    <div className="p-6 border-b border-border/40">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <NodeAvatar
            name={applicant.name}
            initials={applicant.name.charAt(0)}
            sizeClassName="w-16 h-16"
            fontSize={24}
            extraClassName="bg-primary/20 border-2 border-primary/30"
            textClassName="text-primary"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground">{applicant.name}</h2>
              <button onClick={handleToggleBookmark} className="cursor-pointer">
                {applicant.is_bookmarked
                  ? <BookmarkCheck className="w-5 h-5 text-primary" />
                  : <Bookmark className="w-5 h-5 text-muted-foreground/40" />}
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {applicant.job_title || "—"} — {applicant.job_department || ""}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <StarRating value={applicant.rating} onChange={onRatingChange} />
              <StatusBadge colorClassName={rankColor} fontSize={11}>{score}% — {rankText}</StatusBadge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleEdit} className="p-2 rounded-lg hover:bg-secondary cursor-pointer" title={arabicSource("common.edit")}>
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-destructive/10 cursor-pointer" title={arabicSource("common.delete")}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ApplicantDetailHeader);
