import type { CreatePolicyForm, EditPolicyForm } from "../types";
import { arabicSource } from "@/i18n/source";
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
      <input
        type="text"
        value={form.title}
        onChange={(event) => onFormChange({ ...form, title: event.target.value })}
        placeholder={mode === "create" ? arabicSource("policies.enter_the_policy_title") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.category")}</label>
      <select
        value={form.category}
        onChange={(event) => onFormChange({ ...form, category: event.target.value })}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      >
        {policyFormCategories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.description")}</label>
      <input
        type="text"
        value={form.description}
        onChange={(event) => onFormChange({ ...form, description: event.target.value })}
        placeholder={mode === "create" ? arabicSource("policies.brief_description_of_the_policy") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    {mode === "edit" && "status" in form && (
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.status")}</label>
        <select
          value={form.status}
          onChange={(event) => onFormChange({ ...form, status: event.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        >
          {policyStatusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
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
