import { useCallback, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import type { GradeCode } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { EmptyState, LoadingState } from "@/shared/components";
import { useGradeLadderData } from "../hooks/useGradeLadderData";
import { buildCoverageMatrix } from "../utils/gradeLadder";
import GradeBandLegend from "./GradeBandLegend";
import GradeCoverageMatrix from "./GradeCoverageMatrix";
import GradeLadder from "./GradeLadder";
import GradesSummaryHeader from "./GradesSummaryHeader";

/** The Grades tab: the three populations (seats, filled, unassigned), the seven-rung establishment ladder, and the department × grade coverage matrix — all driven by `/api/hr/grades/summary`, including its own department list so the matrix can never miss a name. Read-only: no employee names or editing in this view. */
const GradesView = () => {
  const [expandedCodes, setExpandedCodes] = useState<Set<GradeCode>>(new Set());

  const {
    rows,
    departments,
    totalSeats,
    gradedEmployees,
    unassignedEmployees,
    totalEmployees,
    ungraded,
    loading,
    error,
  } = useGradeLadderData();

  const matrix = useMemo(() => buildCoverageMatrix(rows, departments), [rows, departments]);

  const handleToggleRung = useCallback((code: GradeCode): void => {
    setExpandedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  if (loading) {
    return <LoadingState message={arabicSource("common.loading")} variant="stacked" />;
  }

  if (error || rows.length === 0) {
    return <EmptyState icon={BarChart3} message={error ?? arabicSource("common.error")} />;
  }

  return (
    <div className="space-y-6">
      <GradesSummaryHeader
        totalSeats={totalSeats}
        gradedEmployees={gradedEmployees}
        totalEmployees={totalEmployees}
        unassignedEmployees={unassignedEmployees}
        ungradedEmployees={ungraded.employee_count}
      />
      <GradeBandLegend />
      <GradeLadder rows={rows} expandedCodes={expandedCodes} onToggleRung={handleToggleRung} />
      <GradeCoverageMatrix matrix={matrix} />
    </div>
  );
};

export default GradesView;
