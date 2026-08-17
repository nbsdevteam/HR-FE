import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { CustomBarChart } from "@/shared/components/custom-bar-chart";
import { arabicSource } from "@/i18n/source";
import EvalDetailModal from "../components/EvalDetailModal";
import EvaluationFilters from "../components/EvaluationFilters";
import EvaluationHeader from "../components/EvaluationHeader";
import EvaluationInfoCards from "../components/EvaluationInfoCards";
import EvaluationListView from "../components/EvaluationListView";
import EvaluationStats from "../components/EvaluationStats";
import KanbanView from "../components/KanbanView";
import NewEvalPanel from "../components/NewEvalPanel";
import { useEvaluationPage } from "../hooks/useEvaluationPage";
import { evaluationCardClass } from "../styles";

const EvaluationPage = () => {
  const {
    avgRating,
    completedCount,
    criteria,
    empLoading,
    empMap,
    employees,
    evalSortBy,
    evalSortDir,
    evaluations,
    fetchData,
    filterStatus,
    filtered,
    handleCreatedEvaluation,
    inProgressCount,
    loading,
    ratingDistribution,
    searchText,
    selectedEval,
    setEvalSortBy,
    setEvalSortDir,
    setFilterStatus,
    setSearchText,
    setSelectedEval,
    setShowNewEval,
    setViewMode,
    showNewEval,
    totalEvals,
    closeNewEvaluation,
    viewMode,
  } = useEvaluationPage();

  if (loading || empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("evaluation.loading_reviews")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EvaluationHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewEvaluation={() => setShowNewEval(true)}
      />

      <EvaluationInfoCards />

      <EvaluationStats
        totalEvals={totalEvals}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        avgRating={avgRating}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${evaluationCardClass} p-6`}>
        <h3 className="text-foreground mb-4">{arabicSource("evaluation.distribution_of_ratings")}</h3>
        <CustomBarChart data={ratingDistribution} barLabel={arabicSource("common.number_of_employees")} height={250} color="#D4AF37" />
      </motion.div>

      <EvaluationFilters
        searchText={searchText}
        filterStatus={filterStatus}
        onSearchTextChange={setSearchText}
        onFilterStatusChange={setFilterStatus}
      />

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <EvaluationListView
            evaluations={filtered}
            allEvaluationsCount={evaluations.length}
            empMap={empMap}
            sortBy={evalSortBy}
            sortDir={evalSortDir}
            onSortByChange={setEvalSortBy}
            onSortDirChange={setEvalSortDir}
            onSelectEvaluation={setSelectedEval}
          />
        ) : (
          <KanbanView
            evaluations={filtered}
            empMap={empMap}
            criteria={criteria}
            onSelect={setSelectedEval}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEval && (
          <EvalDetailModal
            evaluation={selectedEval}
            empMap={empMap}
            criteria={criteria.filter(criterion => criterion.evaluation_id === selectedEval.id)}
            allCriteria={criteria}
            onClose={() => setSelectedEval(null)}
            onUpdate={fetchData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewEval && (
          <NewEvalPanel
            employees={employees}
            empMap={empMap}
            onClose={closeNewEvaluation}
            onCreated={handleCreatedEvaluation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvaluationPage;
