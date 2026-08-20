import { memo } from "react";
import { arabicSource } from "@/i18n/source";

type ApplicantNotesCardProps = {
  notes: string;
};

const ApplicantNotesCard = ({ notes }: ApplicantNotesCardProps) => (
  <div>
    <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>
      {arabicSource("common.notes")}
    </label>
    <p className="text-foreground p-3 rounded-lg bg-muted/20 border border-border/20" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
      {notes}
    </p>
  </div>
);

export default memo(ApplicantNotesCard);
