import type { DbPolicy } from "@/shared/hooks";

export type PolicySortKey = "title" | "category" | "status" | "updated";

export interface CreatePolicyForm {
  title: string;
  category: string;
  description: string;
  content: string;
}

export interface EditPolicyForm extends CreatePolicyForm {
  id: string;
  status: string;
  version: number;
}

export type DisplayPolicy = DbPolicy & {
  status: string;
};
