import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STATUS_TONES } from "@/shared/utils/statusColors";
import { ToastType } from "../types";

// Odoo's lugal.hr.training.* models use fixed English selections; the FE
// displays Arabic labels driven by configurations. Map between them explicitly.
export const TRAINING_STATUS_TO_ODOO: Record<string, string> = {
  قادم: "planned",
  جاري: "in_progress",
  مكتمل: "completed",
  ملغي: "cancelled",
};
export const ODOO_TO_TRAINING_STATUS: Record<string, string> = {
  planned: "قادم",
  in_progress: "جاري",
  completed: "مكتمل",
  cancelled: "ملغي",
};
export const PARTICIPANT_STATUS_TO_ODOO: Record<string, string> = {
  مسجل: "enrolled",
  جاري: "in_progress",
  مكتمل: "completed",
  منسحب: "withdrawn",
};
export const ODOO_TO_PARTICIPANT_STATUS: Record<string, string> = {
  enrolled: "مسجل",
  in_progress: "جاري",
  completed: "مكتمل",
  failed: "مكتمل",
  withdrawn: "منسحب",
};

// Ordered palettes walked against the configured status lists (upcoming →
// ongoing → completed → cancelled). Built from the shared semantic tones so the
// Tailwind strings live in exactly one place app-wide.
export const statusColorPalette: readonly string[] = [
  STATUS_TONES.info,
  STATUS_TONES.accent,
  STATUS_TONES.success,
  STATUS_TONES.neutral,
];
export const statusIconPalette: readonly LucideIcon[] = [Calendar, Play, CheckCircle, AlertCircle];

export const participantStatusColorPalette: readonly string[] = [
  STATUS_TONES.info,
  STATUS_TONES.accent,
  STATUS_TONES.success,
  // No shared tone matches red-500 exactly (`redSoft` is red-400, `danger` is
  // the destructive token), so the withdrawn tone stays a literal to keep the
  // rendered colour pixel-identical.
  "bg-red-500/10 border-red-500/20 text-red-400",
];

export const categoryColorPalette = [
  "#D4AF37",
  "#F7E7CE",
  "#7C3AED",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

export const categoryCardIcons = [Target, TrendingUp, BookOpen, Award];
export const categoryCardIconColors = [
  "text-primary",
  "text-accent",
  "text-blue-400",
  "text-emerald-400",
];
export const categoryCardBgColors = [
  "bg-primary/5 border-primary/20",
  "bg-accent/5 border-accent/20",
  "bg-blue-500/5 border-blue-500/20",
  "bg-emerald-500/5 border-emerald-500/20",
];

export const TOAST_TONE_BORDER: Record<ToastType, string> = {
  success: "border-green-500/40",
  error: "border-red-500/40",
  info: "border-blue-500/40",
};

export const TOAST_TONE_ICON_BG: Record<ToastType, string> = {
  success: "bg-green-500/20",
  error: "bg-red-500/20",
  info: "bg-blue-500/20",
};

export const TOAST_TONE_ICON_COLOR: Record<ToastType, string> = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-blue-400",
};
