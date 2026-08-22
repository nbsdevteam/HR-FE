import type { CreatePolicyForm, EditPolicyForm } from "../types";
import { arabicSource } from "@/i18n/source";
import { InputField, Select } from "@/shared/components";
import { policyFormCategories, policyStatusOptions } from "../constants/policies";

type PolicyFormFieldsProps = {
  form: CreatePolicyForm | EditPolicyForm;
  mode: "create" | "edit";
  onFormChange: (form: any) => void;
};

const PolicyFormFields = ({ form, mode, onFormChange }: PolicyFormFieldsProps) => (
  <>
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.address")}</label>
      <InputField
        value={form.title}
        onChange={(title) => onFormChange({ ...form, title })}
        placeholder={mode === "create" ? arabicSource("policies.enter_the_policy_title") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.category")}</label>
      <Select
        value={form.category}
        onChange={(e) => onFormChange({ ...form, category: e.target.value })}
        options={policyFormCategories}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.description")}</label>
      <InputField
        value={form.description}
        onChange={(description) => onFormChange({ ...form, description })}
        placeholder={mode === "create" ? arabicSource("policies.brief_description_of_the_policy") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    {mode === "edit" && "status" in form && (
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.status")}</label>
        <Select
          value={form.status}
          onChange={(e) => onFormChange({ ...form, status: e.target.value })}
          options={policyStatusOptions}
          className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.content")}</label>
      <textarea
        value={form.content}
        onChange={(event) => onFormChange({ ...form, content: event.target.value })}
        placeholder={mode === "create" ? arabicSource("policies.enter_the_full_policy_content") : undefined}
        rows={8}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
      />
    </div>
  </>
);

export default PolicyFormFields;
