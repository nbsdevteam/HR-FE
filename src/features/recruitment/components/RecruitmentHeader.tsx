import { motion } from "motion/react";
import { Plus, UserPlus } from "lucide-react";
import { ViewToggle } from "@/shared/components/ViewToggle";
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
      <h1 className="text-gradient-gold">{arabicSource("common.recruitment")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("recruitment.manage_job_vacancies_candidate_bank_and_ranking_system")}</p>
    </div>
    <div className="flex items-center gap-3 flex-wrap">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onApplicantFormOpen}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer"
        style={{ fontSize: 13 }}
      >
        <UserPlus className="w-4 h-4" /> {arabicSource("recruitment.add_advanced_2")}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onJobFormOpen}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
        style={{ fontSize: 13 }}
      >
        <Plus className="w-4 h-4" /> {arabicSource("common.new_vacancy")}
      </motion.button>
    </div>
  </div>
);

export default RecruitmentHeader;
