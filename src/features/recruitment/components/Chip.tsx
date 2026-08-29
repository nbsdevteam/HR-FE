import { memo } from "react";

/**
 * Consolidates what used to be six near-identical skill/requirement pill
 * components (Applicant/Candidate/Matched/Form skill chips, JobRequirementChip,
 * and SkillTag's matched/missing variants) — same "colored pill of text"
 * shape, differing only in size and color per call site.
 */
export type ChipVariant =
  | "applicant"
  | "candidate"
  | "matched"
  | "matchedTag"
  | "missingTag"
  | "form"
  | "requirement";

type ChipStyle = { className: string; fontSize: number; dataI18nIgnore?: boolean };

const CHIP_STYLES: Record<ChipVariant, ChipStyle> = {
  applicant: {
    className: "px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary",
    fontSize: 12,
  },
  candidate: {
    className: "px-1.5 py-0.5 rounded bg-primary/10 text-primary",
    fontSize: 10,
  },
  matched: {
    className: "px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    fontSize: 10,
  },
  matchedTag: {
    className: "px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    fontSize: 11,
    dataI18nIgnore: true,
  },
  missingTag: {
    className: "px-2 py-0.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive",
    fontSize: 11,
    dataI18nIgnore: true,
  },
  form: {
    className: "px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary",
    fontSize: 11,
  },
  requirement: {
    className: "px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground",
    fontSize: 11,
  },
};

type ChipProps = {
  label: string;
  variant: ChipVariant;
};

const Chip = ({ label, variant }: ChipProps) => {
  const { className, fontSize, dataI18nIgnore } = CHIP_STYLES[variant];
  return (
    <span className={className} style={{ fontSize }} data-i18n-ignore={dataI18nIgnore || undefined}>
      {label}
    </span>
  );
};

export default memo(Chip);
