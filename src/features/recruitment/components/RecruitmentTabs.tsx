import { Sparkles } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type RecruitmentView = "jobs" | "applicants" | "pipeline" | "bank" | "ai";

type RecruitmentTabsProps = {
  view: RecruitmentView;
  onViewChange: (view: RecruitmentView) => void;
};

const RecruitmentTabs = ({ view, onViewChange }: RecruitmentTabsProps) => {
  const tabs = [
    { id: "jobs" as const, label: arabicSource("recruitment.vacancies") },
    { id: "applicants" as const, label: arabicSource("recruitment.applicants") },
    { id: "ai" as const, label: arabicSource("recruitment.ai_tab") },
    { id: "pipeline" as const, label: arabicSource("recruitment.recruitment_path") },
    { id: "bank" as const, label: arabicSource("recruitment.candidates_bank") },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${view === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          style={{ fontSize: 13 }}
        >
          {tab.id === "ai" && <Sparkles className="w-3.5 h-3.5" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default RecruitmentTabs;
