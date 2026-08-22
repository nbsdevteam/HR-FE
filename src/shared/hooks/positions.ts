import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";

export interface DbPosition {
  id: string;
  title_ar: string;
  title_en: string | null;
  department_id: string | null;
  reports_to_position_id: string | null;
  level: number;
  max_headcount: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ── Mock positions for local testing ──
const _mockPositions: DbPosition[] = [
  { id: "mock-pos-ceo", title_ar: arabicSource("messages.general_manager"), title_en: "CEO", department_id: null, reports_to_position_id: null, level: 0, max_headcount: 1, is_active: true, description: arabicSource("messages.the_top_of_the_administrative_pyramid"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-hr-mgr", title_ar: arabicSource("common.human_resources_manager"), title_en: "HR Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-hr-spec", title_ar: arabicSource("messages.human_resources_specialist"), title_en: "HR Specialist", department_id: null, reports_to_position_id: "mock-pos-hr-mgr", level: 2, max_headcount: 3, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-fin-mgr", title_ar: arabicSource("messages.finance_director"), title_en: "Finance Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-accountant", title_ar: arabicSource("messages.accountant"), title_en: "Accountant", department_id: null, reports_to_position_id: "mock-pos-fin-mgr", level: 2, max_headcount: 2, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-it-mgr", title_ar: arabicSource("messages.information_technology_manager"), title_en: "IT Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-developer", title_ar: arabicSource("messages.software_developer"), title_en: "Software Developer", department_id: null, reports_to_position_id: "mock-pos-it-mgr", level: 2, max_headcount: 4, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-ops-mgr", title_ar: arabicSource("messages.operations_manager"), title_en: "Operations Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const usePositions = () => {
  const { data: positions, loading, refetch } = useAsyncList(async () => {
    try {
      const data = await odooData.fetchPositions();
      return data.length > 0 ? data : _mockPositions;
    } catch (e) {
      console.error(e);
      return _mockPositions;
    }
  });
  return { positions, loading, refetch };
}
