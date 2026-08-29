import { useState, useMemo, memo, useCallback } from "react";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import EmptyState from "@/shared/components/EmptyState";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { effectiveScore } from "../utils/recruitmentRanking";
import { applicantsTableColumns } from "../data";
import ApplicantTableRow from "./ApplicantTableRow";

const compareApplicants = (a: DbApplicant, b: DbApplicant, sortBy: string): number => {
  switch (sortBy) {
    case "name":
      return a.name.localeCompare(b.name, "ar");
    case "job":
      return (a.job_title || "").localeCompare(b.job_title || "", "ar");
    case "date":
      return new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime();
    case "stage":
      return a.stage.localeCompare(b.stage, "ar");
    case "rating":
      return a.rating - b.rating;
    default:
      return effectiveScore(a) - effectiveScore(b);
  }
};

interface IApplicantsTableProps {
  applicants: DbApplicant[];
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
  onUpdateStage: (id: string, s: string) => void;
}

const ApplicantsTable = ({
  applicants,
  onSelect,
  onToggleBookmark,
  onUpdateRating,
  onUpdateStage,
}: IApplicantsTableProps) => {
  const [sortBy, setSortBy] = useState("rank");
  const [recSortDir, setRecSortDir] = useState<"asc" | "desc">("desc");

  const sortedApplicants = useMemo(() => {
    const list = [...applicants].sort((a, b) => compareApplicants(a, b, sortBy));
    return recSortDir === "asc" ? list : list.reverse();
  }, [applicants, sortBy, recSortDir]);

  const handleSort = useCallback(
    (key: string): void => {
      toggleSort(key, sortBy, recSortDir, setSortBy, setRecSortDir);
    },
    [sortBy, recSortDir],
  );

  if (applicants.length === 0) {
    return (
      <EmptyState
        icon={Users}
        message={arabicSource("recruitment.there_are_no_applicants")}
        hint={arabicSource("recruitment.click_add_advanced_to_enter_the_first_filter")}
        className="py-16"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
    >
      <DataTable
        wrapperClassName={null}
        items={sortedApplicants}
        header={
          <SortableHeaderRow
            columns={applicantsTableColumns}
            sortBy={sortBy}
            sortDir={recSortDir}
            onSort={handleSort}
          />
        }
        renderRow={(app, i) => (
          <ApplicantTableRow
            key={app.id}
            app={app}
            index={i}
            onSelect={onSelect}
            onToggleBookmark={onToggleBookmark}
            onUpdateRating={onUpdateRating}
            onUpdateStage={onUpdateStage}
          />
        )}
      />
    </motion.div>
  );
};

export default memo(ApplicantsTable);
