import { Award, BookOpen, Calendar, CheckCircle, AlertCircle, Play, Target, TrendingUp } from "lucide-react";

// Odoo's lugal.hr.training.* models use fixed English selections; the FE
// displays Arabic labels driven by configurations. Map between them explicitly.
export const TRAINING_STATUS_TO_ODOO: Record<string, string> = {
  "قادم": "planned", "جاري": "in_progress", "مكتمل": "completed", "ملغي": "cancelled",
};
export const ODOO_TO_TRAINING_STATUS: Record<string, string> = {
  planned: "قادم", in_progress: "جاري", completed: "مكتمل", cancelled: "ملغي",
};
export const PARTICIPANT_STATUS_TO_ODOO: Record<string, string> = {
  "مسجل": "enrolled", "جاري": "in_progress", "مكتمل": "completed", "منسحب": "withdrawn",
};
export const ODOO_TO_PARTICIPANT_STATUS: Record<string, string> = {
  enrolled: "مسجل", in_progress: "جاري", completed: "مكتمل", failed: "مكتمل", withdrawn: "منسحب",
};

// Color palettes for dynamic status/participant status assignment
export const statusColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "bg-muted/30 border-border text-muted-foreground",
];
export const statusIconPalette = [Calendar, Play, CheckCircle, AlertCircle];

export const participantStatusColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "bg-red-500/10 border-red-500/20 text-red-400",
];

export const categoryColorPalette = ["#D4AF37", "#F7E7CE", "#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export const categoryCardIcons = [Target, TrendingUp, BookOpen, Award];
export const categoryCardIconColors = ["text-primary", "text-accent", "text-blue-400", "text-emerald-400"];
export const categoryCardBgColors = [
  "bg-primary/5 border-primary/20",
  "bg-accent/5 border-accent/20",
  "bg-blue-500/5 border-blue-500/20",
  "bg-emerald-500/5 border-emerald-500/20",
];
