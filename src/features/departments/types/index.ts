import type { DbEmployee, DbPosition, DbDepartment } from "@/shared/hooks";

export type OrgNode = {
  id: number;
  dbId: string;
  name: string;
  initials: string;
  position: string;
  department: string;
  color: string;
  photo: string | null;
  email: string | null;
  children: OrgNode[];
  isVacant?: boolean;
  positionId?: string;
  assignedEmployees?: { id: string; name: string; photo: string | null }[];
  headcount?: { current: number; max: number };
};

export type PositionNode = DbPosition & {
  children: PositionNode[];
  assignedEmployees: DbEmployee[];
};

// ——— Positions & appointments tab ———

/** How full a position is, relative to its `max_headcount`. */
export type PositionFillState = "vacant" | "partial" | "full" | "over";

/** Chip filters above the position list. `all` matches every fill state. */
export type PositionFilter = "all" | "vacant" | "partial" | "over";

/** One position rendered as a single card in its department's grid. */
export type PositionRow = {
  node: PositionNode;
  fillState: PositionFillState;
  /** False once headcount is exhausted: the card refuses drops instead of failing after one. */
  canAccept: boolean;
};

export type PositionDepartmentGroup = {
  /** Department id, or a sentinel for positions with no department. */
  id: string;
  name: string;
  color: string;
  rows: PositionRow[];
  /** Remaining headcount across the group's rows. */
  vacancies: number;
};

/** The employee fields a drop overwrites, captured so undo can put them back. */
export type PositionAssignmentSnapshot = {
  position_id: string | null;
  department_id: string | null;
  department: string;
  manager_id: string | null;
};

/** An assignment that is still inside its undo window. */
export type PendingAssignmentUndo = {
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  previous: PositionAssignmentSnapshot;
};

// ——— Org-structure admin screen (backend §4) ———

export type OrgStructureTab = "tree" | "departments" | "designations";

export type DepartmentFormData = {
  name: string;
  name_ar: string;
  parent_id: string;
  manager_id: string;
  default_shift_id: string;
  color: string;
  sort_order: string;
  active: boolean;
};

export type DesignationFormData = {
  name: string;
  title_ar: string;
  description: string;
  department_id: string;
  level: string;
  reports_to_job_id: string;
  max_headcount: string;
  active: boolean;
};

/** In-use guard counts returned by a refused `*_in_use` delete (backend §6). */
export type DepartmentInUseGuard = { employeeCount: number; childCount: number };
export type DesignationInUseGuard = { employeeCount: number; reportCount: number };

export type PendingDepartmentDelete = { department: DbDepartment; guard: DepartmentInUseGuard | null };
export type PendingDesignationDelete = { designation: DbPosition; guard: DesignationInUseGuard | null };

/** A `name_exists`/duplicate rejection pointing at an existing (possibly archived) row (backend §5). */
export type NameConflict = { existingId: number; existingActive: boolean };
