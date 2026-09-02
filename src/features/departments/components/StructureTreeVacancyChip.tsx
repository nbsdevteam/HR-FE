import { useTranslation } from "react-i18next";

type StructureTreeVacancyChipProps = {
  count: number;
};

/**
 * Unfilled seats on a position, stated as a count rather than as placeholder
 * people. Dashed and flagged so an empty seat never reads as a real name.
 */
const StructureTreeVacancyChip = ({ count }: StructureTreeVacancyChipProps) => {
  const { t } = useTranslation();

  if (count <= 0) return null;

  return (
    <div
      className="rounded-lg border border-dashed border-flag-hair bg-flag-bg px-2.5 py-1.5 text-center text-flag tabular-nums"
      style={{ fontSize: 11 }}
    >
      {t("hierarchy.n_vacant", { count })}
    </div>
  );
};

export default StructureTreeVacancyChip;
