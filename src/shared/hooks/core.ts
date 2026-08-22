import { useState, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";

// ——— Raw DB types ———
export interface DbEmployee {
  id: string;
  person_id: number;
  name: string;
  arabic_name: string;
  department: string;
  monthly_salary: number;
  currency: string;
  overtime_rate: number;
  overtime_enabled: boolean;
  allowed_late_minutes: number;
  profile_picture: string | null;
  position: string | null;
  email: string | null;
  personal_phone: string | null;
  company_phone: string | null;
  join_date: string | null;
  end_date: string | null;
  status: string | null;
  address: string | null;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  blood_type: string | null;
  manager_id: string | null;
  shift_id: string | null;
  position_id: string | null;
  direct_manager_id: string | null;
  device_employee_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDepartment {
  id: string;
  name: string;
  color: string;
  description: string | null;
  manager_id: string | null;
  default_shift_id: string | null;
  created_at: string;
  updated_at: string;
}

// ——— Hooks ———

export const useEmployees = () => {
  const { data: employees, loading, error, refetch } = useAsyncList(
    () => odooData.fetchEmployees(),
    [],
    "Failed to load employees"
  );
  return { employees, loading, error, refetch };
}

export const useHierarchyData = () => {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [departments, setDepartments] = useState<DbDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, depts] = await Promise.all([
        odooData.fetchEmployees(),
        odooData.fetchDepartments(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return { employees, departments, loading, refetch: fetchData };
}

// ——— Helpers ———

/** Map DB employee ID to a friendly EMP-XXXX number */
export const empNumber = (personId: number): string => {
  return `EMP-${String(personId).padStart(4, "0")}`;
}

/** Get display name — prefer real Arabic/English names over login-style usernames. */
export const empDisplayName = (e: DbEmployee): string => {
  const ar = (e.arabic_name || "").trim();
  const en = (e.name || "").trim();
  const looksLikeLogin = (s: string) =>
    /^[a-z0-9._-]+$/i.test(s) && (s.includes(".") || s.includes("_"));
  if (ar && /[\u0600-\u06FF]/.test(ar)) return ar;
  if (en && !looksLikeLogin(en)) return en;
  if (ar) return ar;
  if (en) return en;
  return "—";
}
