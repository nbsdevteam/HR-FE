import type { CreatePolicyForm, EditPolicyForm } from "../types";
import { arabicSource } from "@/i18n/source";
import { InputField, Select } from "@/shared/components";
import { policyFormCategories, policyStatusOptions } from "../constants/policies";

type PolicyFormFieldsProps = {
  form: CreatePolicyForm | EditPolicyForm;
  mode: "create" | "edit";
  onFormChange: (form: any) => void;
};

const PolicyFormFields = ({ form, mode, onFormChange }: PolicyFormFieldsProps) => {
  const handleTitleChange = (title: string): void => {
    onFormChange({ ...form, title });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onFormChange({ ...form, category: e.target.value });
  };

  const handleDescriptionChange = (description: string): void => {
    onFormChange({ ...form, description });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onFormChange({ ...form, status: e.target.value });
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFormChange({ ...form, content: event.target.value });
  };

  return (
  <>
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.address")}</label>
      <InputField
        value={form.title}
        onChange={handleTitleChange}
        placeholder={mode === "create" ? arabicSource("policies.enter_the_policy_title") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.category")}</label>
      <Select
        value={form.category}
        onChange={handleCategoryChange}
        options={policyFormCategories}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.description")}</label>
      <InputField
        value={form.description}
        onChange={handleDescriptionChange}
        placeholder={mode === "create" ? arabicSource("policies.brief_description_of_the_policy") : undefined}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
    </div>

    {mode === "edit" && "status" in form && (
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.status")}</label>
        <Select
          value={form.status}
          onChange={handleStatusChange}
          options={policyStatusOptions}
          className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.content")}</label>
      <textarea
        value={form.content}
        onChange={handleContentChange}
        placeholder={mode === "create" ? arabicSource("policies.enter_the_full_policy_content") : undefined}
        rows={8}
        className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
      />
    </div>
  </>
  );
};

export default PolicyFormFields;
