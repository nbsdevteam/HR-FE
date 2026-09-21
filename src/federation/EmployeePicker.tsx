import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "@/shared/components/Select";
import { fetchEmployees } from "@/shared/api/core";
import type { EmployeePickerProps } from "./contracts";

/**
 * HR's employee chooser, for the rest of the composition.
 *
 * Owned by HR because the employee record is: CRM's conversations screen, supply chain's approvals
 * and the contact centre's agent rota all need to name a person, and none of them should be
 * querying /api/hr themselves. Before federation, crm kept its own 8,674-line employees
 * feature and 13 call sites reached into it for an avatar URL alone.
 *
 * Built on the same fetchEmployees the HR dropdowns already use — the full active roster, which the
 * backend caps at 5,000 and which TanStack Query caches once for every consumer in the page. The
 * cache is shared because @tanstack/react-query is a federation singleton, so a CRM screen and an
 * HR screen open at the same time issue one request between them, not two.
 *
 * Satisfies EmployeePickerProps in @nbs/contracts.
 */
const EmployeePicker = ({
  value,
  onChange,
  departmentId,
  placeholder = "Select an employee",
}: EmployeePickerProps) => {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["hr", "employees", "roster"],
    queryFn: fetchEmployees,
    // The roster changes when someone is hired, not between renders.
    staleTime: 10 * 60_000,
  });

  const options = useMemo(() => {
    const scoped = departmentId
      ? employees.filter((employee) => employee.department_id === departmentId)
      : employees;
    return [
      { value: "", label: placeholder },
      ...scoped.map((employee) => ({
        value: employee.id,
        // Arabic name first where present: it is what HR staff recognise on screen.
        label: employee.arabic_name || employee.name,
      })),
    ];
  }, [employees, departmentId, placeholder]);

  return (
    <Select
      options={options}
      value={value ?? ""}
      onChange={(next: string) => onChange(next === "" ? null : next)}
      // Names are backend records, not catalogued UI copy, so they must not be
      // treated as translatable strings by the i18n tooling.
      optionsAreData
      disabled={isLoading}
    />
  );
};

export default EmployeePicker;
