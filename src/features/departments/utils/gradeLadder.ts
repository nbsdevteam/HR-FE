import type { DbDepartment, DbGrade, GradeBand, GradeCode, GradeSummary, GradeSummaryTitle } from "@/shared/hooks";

/** One rung's data — the `hr.grade` reference row merged with its summary counts. Always present for all seven grades, even when `employee_count` is 0. */
export interface GradeLadderRow {
  code: GradeCode;
  sequence: number;
  name: string;
  name_ar: string;
  band: GradeBand;
  description: string | null;
  employee_count: number;
  titles: GradeSummaryTitle[];
  by_department: Record<string, number>;
}

/** Joins the reference table with the summary counts by `code`, in `sequence` order (most senior first). Never re-sort by headcount — vertical position carries seniority. */
export const mergeGradeLadderRows = (grades: DbGrade[], summary: GradeSummary | null): GradeLadderRow[] => {
  const summaryByCode = new Map(summary?.grades.map((entry) => [entry.code, entry]) ?? []);
  return [...grades]
    .sort((a, b) => a.sequence - b.sequence)
    .map((grade) => {
      const entry = summaryByCode.get(grade.code);
      return {
        code: grade.code,
        sequence: grade.sequence,
        name: grade.name,
        name_ar: grade.name_ar,
        band: grade.band,
        description: grade.description,
        employee_count: entry?.employee_count ?? 0,
        titles: entry?.titles ?? [],
        by_department: entry?.by_department ?? {},
      };
    });
};

export const maxEmployeeCount = (rows: GradeLadderRow[]): number =>
  rows.reduce((max, row) => Math.max(max, row.employee_count), 0);

/** Bar width as a share of the largest grade's headcount — never as a share of the company total. */
export const barWidthPercent = (count: number, max: number): number => {
  if (max <= 0 || count <= 0) return 0;
  return Math.round((count / max) * 100);
};

export const BAND_BG_CLASS: Record<GradeBand, string> = {
  leadership: "bg-band-leadership",
  middle: "bg-band-middle",
  delivery: "bg-band-delivery",
};

export type CoverageBin = 0 | 1 | 2 | 3 | 4;

/** Sequential bin for the matrix's four-step ramp: 1-2 / 3-4 / 5-7 / 8-10. `0` means an empty cell, rendered as an en-dash rather than a shaded zero. */
export const coverageBin = (count: number): CoverageBin => {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

export const COVERAGE_BIN_CLASS: Record<CoverageBin, string> = {
  0: "bg-muted/20 text-muted-foreground/50",
  1: "bg-seq-1",
  2: "bg-seq-2",
  3: "bg-seq-3 text-white",
  4: "bg-seq-4 text-seq-4-ink",
};

export interface CoverageMatrixRow {
  departmentId: string;
  departmentName: string;
  cells: Partial<Record<GradeCode, number>>;
  total: number;
}

export interface CoverageMatrix {
  rows: CoverageMatrixRow[];
  columnCodes: GradeCode[];
  columnTotals: Partial<Record<GradeCode, number>>;
  grandTotal: number;
}

/** Pivots the ladder rows (grade → department → count) into department rows with a grade column each, plus row/column totals. Departments with no headcount on any grade are omitted. */
export const buildCoverageMatrix = (rows: GradeLadderRow[], departments: DbDepartment[]): CoverageMatrix => {
  const columnCodes = rows.map((row) => row.code);
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const departmentIdsWithData = new Set<string>();
  rows.forEach((row) => Object.keys(row.by_department).forEach((id) => departmentIdsWithData.add(id)));

  const matrixRows: CoverageMatrixRow[] = [...departmentIdsWithData]
    .map((departmentId) => {
      const cells: Partial<Record<GradeCode, number>> = {};
      let total = 0;
      rows.forEach((row) => {
        const count = row.by_department[departmentId] ?? 0;
        cells[row.code] = count;
        total += count;
      });
      return {
        departmentId,
        departmentName: departmentNameById.get(departmentId) ?? departmentId,
        cells,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

  const columnTotals: Partial<Record<GradeCode, number>> = {};
  let grandTotal = 0;
  columnCodes.forEach((code) => {
    const columnTotal = matrixRows.reduce((sum, row) => sum + (row.cells[code] ?? 0), 0);
    columnTotals[code] = columnTotal;
    grandTotal += columnTotal;
  });

  return { rows: matrixRows, columnCodes, columnTotals, grandTotal };
};
