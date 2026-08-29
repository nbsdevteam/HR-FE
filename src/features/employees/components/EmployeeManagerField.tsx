import { TypeAhead } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { EmployeeOption } from "../types";

const getManagerOptionId = (emp: EmployeeOption): string => emp.dbId;
const getManagerOptionLabel = (emp: EmployeeOption): string => `${emp.name} (${emp.position})`;
const fieldLabelClass = "text-foreground block mb-1.5";

type EmployeeManagerFieldProps = {
  managerId: string;
  managerOptions: EmployeeOption[];
  onChange: (value: string) => void;
};

const EmployeeManagerField = ({ managerId, managerOptions, onChange }: EmployeeManagerFieldProps) => (
  <div>
    <label className={fieldLabelClass} style={{ fontSize: 12 }}>
      {arabicSource("common.direct_manager")}
    </label>
    <TypeAhead
      items={managerOptions}
      getId={getManagerOptionId}
      getLabel={getManagerOptionLabel}
      value={managerId}
      onChange={onChange}
      blankLabel={arabicSource("shared.without_a_direct_manager")}
    />
  </div>
);

export default EmployeeManagerField;
