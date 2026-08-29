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

/**
 * Field-level patch emitted by `PolicyFormFields`. Both the create and the edit
 * dialog feed the same fields, so one patch type replaces the `any`-typed
 * whole-form callback the shared field block used to take.
 */
export type PolicyFormPatch = Partial<EditPolicyForm>;
