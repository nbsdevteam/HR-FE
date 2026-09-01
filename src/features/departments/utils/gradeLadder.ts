import type { DbGrade, GradeBand, GradeCode, GradeSummary, GradeSummaryDepartment, GradeSummaryTitle } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

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
  no_department: number;
  seats: number;
  seats_by_department: Record<string, number>;
  no_department_seats: number;
  vacancies: number;
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
        no_department: entry?.no_department ?? 0,
        seats: entry?.seats ?? 0,
        seats_by_department: entry?.seats_by_department ?? {},
        no_department_seats: entry?.no_department_seats ?? 0,
        vacancies: entry?.vacancies ?? 0,
      };
    });
};

/** The ladder's scale is the establishment, not the residual headcount — headcount drifts, seats do not. */
export const maxSeats = (rows: GradeLadderRow[]): number =>
  rows.reduce((max, row) => Math.max(max, row.seats), 0);

/** Bar width as a share of the largest grade's value — never as a share of the company total. */
export const barWidthPercent = (count: number, max: number): number => {
  if (max <= 0 || count <= 0) return 0;
  return Math.round((count / max) * 100);
};

export const BAND_BG_CLASS: Record<GradeBand, string> = {
  leadership: "bg-band-leadership",
  middle: "bg-band-middle",
  delivery: "bg-band-delivery",
};

/** Which population the coverage matrix is showing — budgeted seats or actual staff. */
export type CoverageMetric = "staff" | "seats";

export type CoverageBin = 0 | 1 | 2 | 3 | 4;

/** Sequential bin for the matrix's four-step ramp. Staff steps at 1-2 / 3-4 / 5-7 / 8+; seats run much higher (grade 5 budgets 26), so they get their own thresholds or the top bin saturates. `0` means an empty cell, rendered as an en-dash rather than a shaded zero. */
export const coverageBin = (count: number, metric: CoverageMetric = "staff"): CoverageBin => {
  if (count <= 0) return 0;
  if (metric === "seats") {
    if (count <= 3) return 1;
    if (count <= 7) return 2;
    if (count <= 14) return 3;
    return 4;
  }
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

/** Sentinel row id for staff and seats that hang off a position with no department — without it the matrix totals come up short of the ladder's. */
export const NO_DEPARTMENT_ID = "__none__";

export interface CoverageMatrixRow {
  departmentId: string;
  departmentName: string;
  cells: Partial<Record<GradeCode, number>>;
  seatCells: Partial<Record<GradeCode, number>>;
  total: number;
  seatTotal: number;
}

export interface CoverageMatrix {
  rows: CoverageMatrixRow[];
  columnCodes: GradeCode[];
  columnTotals: Partial<Record<GradeCode, number>>;
  seatColumnTotals: Partial<Record<GradeCode, number>>;
  grandTotal: number;
  seatGrandTotal: number;
}

/** Pivots the ladder rows (grade → department → count) into department rows carrying both a staff and a seat cell per grade, plus row/column totals for each. Departments with neither staff nor seats on any grade are omitted; the department-less remainder is kept as a synthetic last row so the matrix totals match the ladder's. */
export const buildCoverageMatrix = (rows: GradeLadderRow[], departments: GradeSummaryDepartment[]): CoverageMatrix => {
  const columnCodes = rows.map((row) => row.code);
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const departmentIdsWithData = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row.by_department).forEach((id) => departmentIdsWithData.add(id));
    Object.keys(row.seats_by_department).forEach((id) => departmentIdsWithData.add(id));
  });

  const hasDepartmentless = rows.some((row) => row.no_department > 0 || row.no_department_seats > 0);

  const buildRow = (departmentId: string, departmentName: string, departmentless: boolean): CoverageMatrixRow => {
    const cells: Partial<Record<GradeCode, number>> = {};
    const seatCells: Partial<Record<GradeCode, number>> = {};
    let total = 0;
    let seatTotal = 0;
    rows.forEach((row) => {
      const count = departmentless ? row.no_department : row.by_department[departmentId] ?? 0;
      const seatCount = departmentless ? row.no_department_seats : row.seats_by_department[departmentId] ?? 0;
      cells[row.code] = count;
      seatCells[row.code] = seatCount;
      total += count;
      seatTotal += seatCount;
    });
    return { departmentId, departmentName, cells, seatCells, total, seatTotal };
  };

  const matrixRows: CoverageMatrixRow[] = [...departmentIdsWithData]
    .map((departmentId) => buildRow(departmentId, departmentNameById.get(departmentId) ?? departmentId, false))
    .sort((a, b) => b.seatTotal - a.seatTotal || b.total - a.total);

  // Sorted last regardless of size — it is a remainder, not a department.
  if (hasDepartmentless) {
    matrixRows.push(buildRow(NO_DEPARTMENT_ID, arabicSource("hierarchy.no_department"), true));
  }

  const columnTotals: Partial<Record<GradeCode, number>> = {};
  const seatColumnTotals: Partial<Record<GradeCode, number>> = {};
  let grandTotal = 0;
  let seatGrandTotal = 0;
  columnCodes.forEach((code) => {
    const columnTotal = matrixRows.reduce((sum, row) => sum + (row.cells[code] ?? 0), 0);
    const seatColumnTotal = matrixRows.reduce((sum, row) => sum + (row.seatCells[code] ?? 0), 0);
    columnTotals[code] = columnTotal;
    seatColumnTotals[code] = seatColumnTotal;
    grandTotal += columnTotal;
    seatGrandTotal += seatColumnTotal;
  });

  return { rows: matrixRows, columnCodes, columnTotals, seatColumnTotals, grandTotal, seatGrandTotal };
};
