import type { EmployeeAddForm } from "../types";

/**
 * The backend takes address as a single nested object (§3 of the address
 * spec) — only include the keys the user actually filled in. Ids come from
 * picking an item off the country/state/city dropdowns, so they're always
 * present alongside a name; send the id — "the id wins" server-side.
 */
const buildAddressPayload = (form: EmployeeAddForm): Record<string, string | number> => {
  const address: Record<string, string | number> = {};
  if (form.countryId) address.country_id = Number(form.countryId);
  else if (form.country) address.country = form.country;
  if (form.stateId) address.state_id = Number(form.stateId);
  else if (form.state) address.state = form.state;
  if (form.cityId) address.city_id = Number(form.cityId);
  else if (form.city) address.city = form.city;
  if (form.residence) address.residence = form.residence;
  return address;
};

/** `/api/hr/employees/create` body for a filled-in Add Employee form. */
export const buildEmployeeCreatePayload = (
  form: EmployeeAddForm,
  personId: number,
): Record<string, unknown> => ({
  name: form.name,
  email: form.email || null,
  personal_phone: form.personalPhone || null,
  phone: form.personalPhone || form.companyPhone || null,
  address: buildAddressPayload(form),
  monthly_salary: parseFloat(form.salary) || 0,
  join_date: form.joinDate || null,
  // Optional everywhere: `null` on create means "no birth date on file".
  birth_date: form.birthDate || null,
  national_id: form.nationalId || null,
  status: "active",
  person_id: personId,
  device_employee_no: String(personId),
  gender: form.gender || null,
  manager_id: form.managerId || null,
  department_id: form.departmentId || null,
  designation_id: form.designationId || null,
  nationality: form.nationality || null,
  work_location: form.workLocation || "",
});
