import type { DbEmployee, DbPosition } from "@/shared/hooks";

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
