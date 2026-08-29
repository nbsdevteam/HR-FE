/**
 * Public leave-request links — HR-side admin over the `/leave-request/:token`
 * no-login flow (backend hand-off §8). Split out of `leave.ts` so neither
 * file outgrows the 300-line limit.
 */
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

export interface DbLeaveLink {
  id: string;
  name: string;
  token: string;
  url: string;
  base_url_configured: boolean;
  active: boolean;
  expires_on: string | null;
  max_submissions: number;
  submission_count: number;
  require_verification: "none" | "employee_code" | "birthday" | "phone_last4";
  allow_attachments: boolean;
  leave_type_ids: string[];
  leave_type_names: string[];
  department_ids: string[];
  department_names: string[];
  request_count: number;
  unusable_reason: string;
  created_at: string;
  updated_at: string;
}

export const useLeaveLinks = () => {
  const { data: links, loading, refetch } = useCachedList("leaveLinks", () => odooData.fetchLeaveLinks(), "Failed to load leave request links");
  return { links, loading, refetch };
}
