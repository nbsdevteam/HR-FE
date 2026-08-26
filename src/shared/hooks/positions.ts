import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

export interface DbPosition {
  id: string;
  legacy_id: string;
  title_ar: string;
  title_en: string | null;
  department_id: string | null;
  department_name: string | null;
  reports_to_position_id: string | null;
  reports_to_job_name: string | null;
  level: number;
  max_headcount: number;
  employee_count: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const usePositions = () => {
  const { data: positions, loading, error, refetch } = useCachedList(
    "positions",
    () => odooData.fetchPositions(),
    "Failed to load positions",
  );
  return { positions, loading, error, refetch };
}
