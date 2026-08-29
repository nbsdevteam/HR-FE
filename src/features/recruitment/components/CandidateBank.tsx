import { useState, useMemo, memo } from "react";
import { Search, BookmarkCheck, Trophy, TrendingUp } from "lucide-react";
import EmptyState from "@/shared/components/EmptyState";
import { SearchInput, Select } from "@/shared/components";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { effectiveScore } from "../utils/recruitmentRanking";
import type { sortTypes } from "../types";
import CandidateCard from "./CandidateCard";

const BANK_SORT_OPTIONS = [
  { value: "rank", label: arabicSource("recruitment.sort_by_efficiency") },
  { value: "rating", label: arabicSource("recruitment.sort_by_rating") },
  { value: "date", label: arabicSource("recruitment.sort_by_date") },
  { value: "name", label: arabicSource("recruitment.alphabetical_order") },
];

type CandidateBankProps = {
  applicants: DbApplicant[];
  sortBy: sortTypes;
  setSortBy: (s: sortTypes) => void;
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
};

const CandidateBank = ({
  applicants,
  onSelect,
  onToggleBookmark,
  onUpdateRating,
  sortBy,
  setSortBy,
}: CandidateBankProps) => {
  const [bankSearch, setBankSearch] = useState("");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [skillFilter, setSkillFilter] = useState("");

  // All unique skills
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => (a.skills || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [applicants]);

  const filtered = useMemo(() => {
    let list = [...applicants];
    if (onlyBookmarked) list = list.filter((a) => a.is_bookmarked);
    if (bankSearch) {
      const q = bankSearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (a.education || "").toLowerCase().includes(q) ||
          (a.current_company || "").toLowerCase().includes(q),
      );
    }
    if (skillFilter)
      list = list?.filter((a) => (a.skills || []).includes(skillFilter));

    list.sort((a, b) => {
      if (sortBy === "rank") return effectiveScore(b) - effectiveScore(a);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "date")
        return (
          new Date(b.applied_date).getTime() -
          new Date(a.applied_date).getTime()
        );
      return a.name.localeCompare(b.name, "ar");
    });
    return list;
  }, [applicants, bankSearch, onlyBookmarked, skillFilter, sortBy]);

  const handleToggleOnlyBookmarked = (): void => {
    setOnlyBookmarked(!onlyBookmarked);
  };

  const handleSkillFilterChange = (value: string): void => {
    setSkillFilter(value);
  };

  const handleSortByChange = (value: string): void => {
    setSortBy(value as sortTypes);
  };

  return (
    <div className="space-y-4">
      {/* Bank header */}
      <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-foreground">
              {arabicSource("recruitment.candidate_bank_smart_ranking_system")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOnlyBookmarked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${onlyBookmarked ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted/20"}`}
              style={{ fontSize: 12 }}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />{" "}
              {arabicSource("recruitment.favorites_only")}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            wrapperClassName="relative flex-1 min-w-[200px]"
            iconClassName="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            inputClassName="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            placeholder={arabicSource(
              "recruitment.search_by_name_skills_company_education",
            )}
            value={bankSearch}
            onChange={setBankSearch}
            style={{ fontSize: 13 }}
          />
          <Select
            value={skillFilter}
            onChange={handleSkillFilterChange}
            options={allSkills}
            blankLabel={arabicSource("recruitment.all_skills")}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer"
            style={{ fontSize: 13 }}
          />
          <Select
            value={sortBy}
            onChange={handleSortByChange}
            options={BANK_SORT_OPTIONS}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Ranking explanation */}
      <div className="bg-gradient-to-l from-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          <TrendingUp className="w-4 h-4 text-primary inline-block me-1" />
          <strong className="text-foreground">
            {arabicSource("recruitment.ranking_algorithm")}
          </strong>{" "}
          {arabicSource(
            "recruitment.manual_evaluation_40_stage_progression_20_years_of_experience_25",
          )}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            message={arabicSource("recruitment.there_are_no_matching_candidates")}
            className="col-span-full py-16"
          />
        ) : (
          filtered.map((app, i) => (
            <CandidateCard
              key={app.id}
              app={app}
              index={i}
              onSelect={onSelect}
              onToggleBookmark={onToggleBookmark}
              onUpdateRating={onUpdateRating}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default memo(CandidateBank);
