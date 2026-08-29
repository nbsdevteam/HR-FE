import { memo } from "react";
import { motion } from "motion/react";
import { Plus, UserPlus } from "lucide-react";
import ViewToggle from "@/shared/components/ViewToggle";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type RecruitmentHeaderProps = {
  viewMode: "list" | "kanban";
  onApplicantFormOpen: () => void;
  onJobFormOpen: () => void;
  onViewModeChange: (viewMode: "list" | "kanban") => void;
};

const RecruitmentHeader = ({
  viewMode,
  onApplicantFormOpen,
  onJobFormOpen,
  onViewModeChange,
}: RecruitmentHeaderProps) => (
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-gradient-gold">
        {arabicSource("common.recruitment")}
      </h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource(
          "recruitment.manage_job_vacancies_candidate_bank_and_ranking_system",
        )}
      </p>
    </div>
    <div className="flex items-center gap-3 flex-wrap">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="unstyled"
          size="lg"
          icon={UserPlus}
          onClick={onApplicantFormOpen}
          className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg cursor-pointer"
          style={{ fontSize: 13 }}
        >
          {arabicSource("recruitment.add_advanced_2")}
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          icon={Plus}
          onClick={onJobFormOpen}
          className="shadow-lg shadow-primary/20 cursor-pointer"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.new_vacancy")}
        </Button>
      </motion.div>
    </div>
  </div>
);

export default memo(RecruitmentHeader);
