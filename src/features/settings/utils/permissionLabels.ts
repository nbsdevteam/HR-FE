const SECTION_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  employees: "الموظفون",
  departments: "الأقسام",
  designations: "المسميات الوظيفية",
  org: "الهيكل التنظيمي",
  attendance: "الحضور",
  leave: "الإجازات",
  approvals: "الموافقات",
  issues: "المشاكل",
  documents: "المستندات",
  notes: "الملاحظات",
  shifts: "الورديات",
  holidays: "العطل الرسمية",
  configs: "الإعدادات",
  modules: "الوحدات",
  payroll: "الرواتب",
  devices: "الأجهزة",
  lifecycle: "دورة حياة الموظف",
  warnings: "الإنذارات",
  notifications: "الإشعارات",
  audit: "سجل التدقيق",
  evaluations: "التقييمات",
  policies: "السياسات",
  training: "التدريب",
  recruitment: "التوظيف",
  reports: "التقارير",
  roles_permissions: "الأدوار والصلاحيات",
};

const ACTION_LABELS: Record<string, string> = {
  list: "عرض القائمة",
  view: "عرض التفاصيل",
  create: "إنشاء",
  edit: "تعديل",
  delete: "حذف",
  deactivate: "إلغاء التفعيل",
  generate: "توليد",
  import: "استيراد",
  own: "الإجازات الخاصة",
  team_approve: "موافقة إجازات الفريق",
  hr_approve: "موافقة الموارد البشرية",
  manage_types: "إدارة أنواع الإجازات",
  permissions: "إدارة الصلاحيات",
  manage: "إدارة",
};

/** Fallback for a section/action the label maps don't know about yet — keeps a schema addition from rendering a raw snake_case key. */
const humanize = (key: string): string =>
  key
    .split("_")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");

export const permissionSectionLabel = (section: string): string =>
  SECTION_LABELS[section] ?? humanize(section);

export const permissionActionLabel = (action: string): string =>
  ACTION_LABELS[action] ?? humanize(action);
