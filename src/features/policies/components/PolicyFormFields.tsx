import { arabicSource } from "@/i18n/source";
import { InputField, Select } from "@/shared/components";
import { policyFormCategories, policyStatusOptions } from "../constants/policies";
import { policyFieldCls } from "../styles";
import type { CreatePolicyForm, EditPolicyForm, PolicyFormPatch } from "../types";

type PolicyFormFieldsProps = {
  form: CreatePolicyForm | EditPolicyForm;
  mode: "create" | "edit";
  onFormChange: (patch: PolicyFormPatch) => void;
};

const PolicyFormFields = ({ form, mode, onFormChange }: PolicyFormFieldsProps) => {
  const handleTitleChange = (title: string): void => {
    onFormChange({ title });
  };

  const handleCategoryChange = (category: string): void => {
    onFormChange({ category });
  };

  const handleDescriptionChange = (description: string): void => {
    onFormChange({ description });
  };

  const handleStatusChange = (status: string): void => {
    onFormChange({ status });
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFormChange({ content: event.target.value });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {arabicSource("common.address")}
        </label>
        <InputField
          value={form.title}
          onChange={handleTitleChange}
          placeholder={mode === "create" ? arabicSource("policies.enter_the_policy_title") : undefined}
          className={policyFieldCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {arabicSource("common.category")}
        </label>
        <Select
          value={form.category}
          onChange={handleCategoryChange}
          options={policyFormCategories}
          className={policyFieldCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {arabicSource("common.description")}
        </label>
        <InputField
          value={form.description}
          onChange={handleDescriptionChange}
          placeholder={
            mode === "create" ? arabicSource("policies.brief_description_of_the_policy") : undefined
          }
          className={policyFieldCls}
        />
      </div>

      {mode === "edit" && "status" in form && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {arabicSource("common.status")}
          </label>
          <Select
            value={form.status}
            onChange={handleStatusChange}
            options={policyStatusOptions}
            className={policyFieldCls}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {arabicSource("common.content")}
        </label>
        <textarea
          value={form.content}
          onChange={handleContentChange}
          placeholder={
            mode === "create" ? arabicSource("policies.enter_the_full_policy_content") : undefined
          }
          rows={8}
          className={`${policyFieldCls} resize-none`}
        />
      </div>
    </>
  );
};

export default PolicyFormFields;
