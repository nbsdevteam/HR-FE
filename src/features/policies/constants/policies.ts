import { Calendar, Clock, FileText, Shield, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { STATUS_TONES } from "@/shared/utils/statusColors";

export const POLICY_STATUS_TO_ODOO: Record<string, string> = {
  "نشط": "active",
  "قيد المراجعة": "draft",
  "مؤرشف": "archived",
};

export const ODOO_STATUS_TO_POLICY: Record<string, string> = {
  active: "نشط",
  draft: "قيد المراجعة",
  archived: "مؤرشف",
};

export const POLICY_CATEGORY_ICONS: Record<string, LucideIcon> = {
  [arabicSource("common.vacations_2")]: Calendar,
  [arabicSource("common.attendance_2")]: Clock,
  [arabicSource("common.salaries_2")]: Wallet,
  [arabicSource("common.behavior")]: Shield,
  [arabicSource("common.training")]: Users,
  [arabicSource("common.general")]: FileText,
};

export const policyCategories = [
  arabicSource("common.all"),
  arabicSource("common.vacations_2"),
  arabicSource("common.attendance_2"),
  arabicSource("common.salaries_2"),
  arabicSource("common.behavior"),
  arabicSource("common.training"),
  arabicSource("common.general"),
];

export const policyFormCategories = policyCategories.filter((category) => category !== arabicSource("common.all"));

export const policyStatusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: STATUS_TONES.success,
  [arabicSource("common.is_under_review")]: STATUS_TONES.accent,
  [arabicSource("common.archived")]: STATUS_TONES.neutral,
};

export const policyStatusOptions = [
  arabicSource("common.is_active"),
  arabicSource("common.is_under_review"),
  arabicSource("common.archived"),
];

export const policiesPageSize = 10;
