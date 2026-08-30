import { useCallback } from "react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { inputCls } from "../styles";
import type { NewLeaveTypeForm } from "../types";

type TLeaveTypeOtherFieldsProps = {
  form: NewLeaveTypeForm;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

const LeaveTypeOtherFields = ({ form, onFieldChange }: TLeaveTypeOtherFieldsProps) => {
  const handleCodeChange = useCallback(
    (value: string): void => {
      onFieldChange({ code: value });
    },
    [onFieldChange],
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ color: e.target.value });
    },
    [onFieldChange],
  );

  const handleIconChange = useCallback(
    (value: string): void => {
      onFieldChange({ icon: value });
    },
    [onFieldChange],
  );

  const handleSortOrderChange = useCallback(
    (value: string): void => {
      onFieldChange({ sort_order: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-2">
      <h4 className="text-muted-foreground text-xs">{arabicSource("settings.advanced_section_other")}</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
        <div>
          <InputField
            value={form.code}
            onChange={handleCodeChange}
            placeholder={arabicSource("settings.code_label")}
            className={inputCls}
            dir="ltr"
          />
          <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
            {arabicSource("settings.code_optional_hint")}
          </p>
        </div>
        <input
          type="color"
          value={form.color}
          onChange={handleColorChange}
          className="w-9 h-9 rounded cursor-pointer border-0"
          aria-label={arabicSource("org_structure.color_label")}
        />
        <InputField
          value={form.icon}
          onChange={handleIconChange}
          placeholder={arabicSource("settings.icon_label")}
          className={inputCls}
          dir="ltr"
        />
        <InputField
          type="number"
          value={form.sort_order || ""}
          onChange={handleSortOrderChange}
          placeholder={arabicSource("settings.sort_order_label")}
          className={inputCls}
        />
      </div>
    </div>
  );
};

export default LeaveTypeOtherFields;
