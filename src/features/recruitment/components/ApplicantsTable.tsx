import { useState, memo } from "react";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { applicantsTableColumns } from "../data";
import ApplicantTableRow from "./ApplicantTableRow";

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

  if (applicants.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{arabicSource("recruitment.there_are_no_applicants")}</p>
        <p style={{ fontSize: 12 }}>
          {arabicSource(
            "recruitment.click_add_advanced_to_enter_the_first_filter",
          )}
        </p>
      </div>
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
        items={applicants}
        header={
          <SortableHeaderRow
            columns={applicantsTableColumns}
            sortBy={sortBy}
            sortDir={recSortDir}
            onSort={(key) =>
              toggleSort(key, sortBy, recSortDir, setSortBy, setRecSortDir)
            }
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
