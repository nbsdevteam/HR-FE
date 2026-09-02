import type { Employee } from "../types";

/**
 * The backend takes address as a single nested object (§3 of the address
 * spec) — only include the keys the user actually filled in. Ids come from
 * picking an item off the country/state/city dropdowns, so they're always
 * present alongside a name; send the id — "the id wins" server-side.
 */
const buildAddressPayload = (editData: Employee): Record<string, string | number> => {
  const address: Record<string, string | number> = {};
  if (editData.countryId) address.country_id = Number(editData.countryId);
  else if (editData.country) address.country = editData.country;
  if (editData.stateId) address.state_id = Number(editData.stateId);
  else if (editData.state) address.state = editData.state;
  if (editData.cityId) address.city_id = Number(editData.cityId);
  else if (editData.city) address.city = editData.city;
  if (editData.residence) address.residence = editData.residence;
  return address;
};

/**
 * `/update` is a partial patch, and on it `null` means "not part of this
 * patch" while `""` *erases* the stored value. So the key only goes out when
 * the user actually touched the field, and only as `""` when they cleared a
 * value that was there.
 */
const buildTouchedPatch = (field: string, current: string, original: string): Record<string, string> =>
  current !== original ? { [field]: current || "" } : {};

/** `/api/hr/employees/<id>/update` body for the edit panel's current form state. */
export const buildEmployeeUpdatePayload = (
  editData: Employee,
  employee: Employee,
  resolvedDepartmentId: string | null,
  resolvedPositionId: string | null,
): Record<string, unknown> => ({
  name: editData.name,
  email: editData.email,
  personal_phone: editData.personalPhone,
  company_phone: editData.companyPhone,
  phone: editData.personalPhone || editData.companyPhone,
  monthly_salary: editData.salary,
  join_date: editData.startDate || null,
  end_date: editData.endDate || null,
  status: editData.status,
  department_id: resolvedDepartmentId,
  designation_id: resolvedPositionId,
  address: buildAddressPayload(editData),
  work_location: editData.workLocation || "",
  // The read API returns this field as `identification_id`; send both names
  // since it's unclear which one the update handler consumes.
  national_id: editData.nationalId,
  identification_id: editData.nationalId,
  emergency_contact: editData.emergencyContact,
  emergency_phone: editData.emergencyPhone,
  blood_type: editData.bloodType || null,
  manager_id: editData.managerId || null,
  ...buildTouchedPatch("birth_date", editData.birthDate, employee.birthDate),
  ...buildTouchedPatch("photo", editData.photo, employee.photo),
});
