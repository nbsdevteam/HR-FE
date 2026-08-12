/**
 * Lightweight AR/EN i18n for HR-FE cutover testing.
 * Keys are English identifiers; Arabic is the default UI language.
 */
export type AppLanguage = "ar" | "en";

type Dict = Record<string, string>;

const en: Dict = {
  // App / common
  "app.name": "HR Management System",
  "app.shortName": "HR System",
  "common.loading": "Loading...",
  "common.search": "Search...",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.close": "Close",
  "common.all": "All",
  "common.actions": "Actions",
  "common.status": "Status",
  "common.department": "Department",
  "common.employee": "Employee",
  "common.date": "Date",
  "common.yes": "Yes",
  "common.no": "No",
  "common.error": "Error",
  "common.success": "Success",
  "common.view": "View",
  "common.language": "Language",
  "common.arabic": "Arabic",
  "common.english": "English",
  "common.logout": "Sign out",
  "common.timezone": "Timezone",
  "common.system": "System",

  // Nav
  "nav.dashboard": "Dashboard",
  "nav.employees": "Employees",
  "nav.attendance": "Attendance",
  "nav.leave": "Leave",
  "nav.payroll": "Payroll",
  "nav.evaluation": "Performance",
  "nav.warnings": "Warnings",
  "nav.policies": "Policies",
  "nav.hierarchy": "Org Chart",
  "nav.recruitment": "Recruitment",
  "nav.training": "Training",
  "nav.lifecycle": "Employee Lifecycle",
  "nav.reports": "Reports",
  "nav.devices": "Biometric Devices",
  "nav.audit": "Logs & Notifications",
  "nav.settings": "Settings",

  // Login
  "login.title": "HR Management System",
  "login.subtitleLogin": "Sign in to your account",
  "login.subtitleRegister": "Create a new account",
  "login.email": "Email",
  "login.username": "Username",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.register": "Create account",
  "login.needAccount": "Don't have an account? Create one",
  "login.haveAccount": "Already have an account? Sign in",
  "login.required": "Please enter username/email and password",
  "login.registerSuccess": "Account created successfully! You can sign in now.",
  "login.langHint": "Language",

  // TopBar
  "topbar.search": "Search employees, departments...",
  "topbar.notifications": "Notifications",
  "topbar.device": "Device",
  "topbar.online": "Online",
  "topbar.stale": "Stale",
  "topbar.offline": "Offline",
  "topbar.noDevice": "No device",
  "topbar.now": "Just now",
  "topbar.minutesAgo": "{n} min ago",
  "topbar.hoursAgo": "{n} h ago",
  "topbar.daysAgo": "{n} d ago",
  "topbar.sync": "Sync now",
  "topbar.syncing": "Syncing...",

  // Dashboard
  "dashboard.title": "Dashboard",
  "dashboard.loading": "Loading dashboard...",

  // Employees
  "employees.title": "Employees",
  "employees.subtitle": "Manage employee records",
  "employees.loading": "Loading employees...",
  "employees.total": "Total employees",
  "employees.add": "Add employee",
  "employees.deleteConfirm": "Delete employee?",
  "employees.deleting": "Deleting...",
  "employees.deleteBtn": "Delete employee",

  // Attendance
  "attendance.title": "Attendance",
  "attendance.subtitle": "Daily attendance and punches",
  "attendance.loading": "Loading attendance records...",
  "attendance.weekly": "Weekly attendance",
  "attendance.present": "Present",
  "attendance.late": "Late",
  "attendance.absent": "Absent",
  "attendance.leave": "On leave",
  "attendance.checkIn": "Check-in",
  "attendance.checkOut": "Check-out",
  "attendance.hours": "Hours",
  "attendance.overtime": "Overtime",

  // Leave
  "leave.title": "Leave Management",
  "leave.subtitle": "Requests, balances, and permissions",
  "leave.loading": "Loading leave data...",
  "leave.requests": "Leave requests",
  "leave.balances": "Leave balances",
  "leave.permissions": "Permissions",
  "leave.type": "Leave type",
  "leave.pending": "Pending",
  "leave.approved": "Approved",
  "leave.rejected": "Rejected",

  // Payroll
  "payroll.title": "Payroll & Payslips",
  "payroll.subtitle": "Full payslip engine — {month}",
  "payroll.loading": "Loading payroll data...",
  "payroll.overview": "Payroll",
  "payroll.upload": "Upload attendance",
  "payroll.basicTotal": "Total basic salaries",
  "payroll.netTotal": "Net salaries",

  // Settings
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.monthFormat": "Month display format",
  "settings.langSaved": "Language updated",
};

const ar: Dict = {
  "app.name": "نظام إدارة الموارد البشرية",
  "app.shortName": "نظام الموارد البشرية",
  "common.loading": "جاري التحميل...",
  "common.search": "بحث...",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.add": "إضافة",
  "common.close": "إغلاق",
  "common.all": "الكل",
  "common.actions": "إجراءات",
  "common.status": "الحالة",
  "common.department": "القسم",
  "common.employee": "الموظف",
  "common.date": "التاريخ",
  "common.yes": "نعم",
  "common.no": "لا",
  "common.error": "خطأ",
  "common.success": "نجاح",
  "common.view": "عرض",
  "common.language": "اللغة",
  "common.arabic": "العربية",
  "common.english": "English",
  "common.logout": "تسجيل الخروج",
  "common.timezone": "المنطقة الزمنية",
  "common.system": "النظام",

  "nav.dashboard": "لوحة التحكم",
  "nav.employees": "الموظفون",
  "nav.attendance": "الحضور والانصراف",
  "nav.leave": "الإجازات",
  "nav.payroll": "الرواتب",
  "nav.evaluation": "تقييم الأداء",
  "nav.warnings": "الإنذارات",
  "nav.policies": "السياسات",
  "nav.hierarchy": "الهيكل التنظيمي",
  "nav.recruitment": "التوظيف",
  "nav.training": "التدريب والتطوير",
  "nav.lifecycle": "دورة حياة الموظف",
  "nav.reports": "التقارير",
  "nav.devices": "أجهزة البصمة",
  "nav.audit": "السجلات والإشعارات",
  "nav.settings": "الإعدادات",

  "login.title": "نظام إدارة الموارد البشرية",
  "login.subtitleLogin": "تسجيل الدخول إلى حسابك",
  "login.subtitleRegister": "إنشاء حساب جديد",
  "login.email": "البريد الإلكتروني",
  "login.username": "اسم المستخدم",
  "login.password": "كلمة المرور",
  "login.submit": "تسجيل الدخول",
  "login.register": "إنشاء الحساب",
  "login.needAccount": "ليس لديك حساب؟ إنشاء حساب جديد",
  "login.haveAccount": "لديك حساب بالفعل؟ تسجيل الدخول",
  "login.required": "يرجى إدخال البريد الإلكتروني وكلمة المرور",
  "login.registerSuccess": "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.",
  "login.langHint": "اللغة",

  "topbar.search": "بحث عن موظفين، أقسام...",
  "topbar.notifications": "الإشعارات",
  "topbar.device": "الجهاز",
  "topbar.online": "متصل",
  "topbar.stale": "متأخر",
  "topbar.offline": "غير متصل",
  "topbar.noDevice": "لا يوجد جهاز",
  "topbar.now": "الآن",
  "topbar.minutesAgo": "منذ {n} دقيقة",
  "topbar.hoursAgo": "منذ {n} ساعة",
  "topbar.daysAgo": "منذ {n} يوم",
  "topbar.sync": "مزامنة الآن",
  "topbar.syncing": "جاري المزامنة...",

  "dashboard.title": "لوحة التحكم",
  "dashboard.loading": "جاري تحميل لوحة التحكم...",

  "employees.title": "الموظفون",
  "employees.subtitle": "إدارة بيانات الموظفين",
  "employees.loading": "جاري تحميل بيانات الموظفين...",
  "employees.total": "إجمالي الموظفين",
  "employees.add": "إضافة موظف",
  "employees.deleteConfirm": "حذف الموظف؟",
  "employees.deleting": "جاري الحذف...",
  "employees.deleteBtn": "حذف الموظف",

  "attendance.title": "الحضور والانصراف",
  "attendance.subtitle": "سجلات الحضور اليومية",
  "attendance.loading": "جاري تحميل سجلات الحضور...",
  "attendance.weekly": "الحضور الأسبوعي",
  "attendance.present": "حاضر",
  "attendance.late": "متأخر",
  "attendance.absent": "غائب",
  "attendance.leave": "إجازة",
  "attendance.checkIn": "الحضور",
  "attendance.checkOut": "الانصراف",
  "attendance.hours": "الساعات",
  "attendance.overtime": "الإضافي",

  "leave.title": "إدارة الإجازات",
  "leave.subtitle": "متابعة طلبات الإجازة والأرصدة والاستئذانات",
  "leave.loading": "جاري تحميل بيانات الإجازات...",
  "leave.requests": "طلبات الإجازة",
  "leave.balances": "أرصدة الإجازات",
  "leave.permissions": "الاستئذانات",
  "leave.type": "نوع الإجازة",
  "leave.pending": "معلق",
  "leave.approved": "مقبول",
  "leave.rejected": "مرفوض",

  "payroll.title": "إدارة الرواتب والكشوفات",
  "payroll.subtitle": "نظام كشوفات الرواتب الشامل — {month}",
  "payroll.loading": "جاري تحميل بيانات الرواتب...",
  "payroll.overview": "الرواتب",
  "payroll.upload": "رفع الحضور",
  "payroll.basicTotal": "إجمالي الرواتب الأساسية",
  "payroll.netTotal": "صافي الرواتب",

  "settings.title": "الإعدادات",
  "settings.language": "اللغة",
  "settings.monthFormat": "تنسيق عرض الشهر",
  "settings.langSaved": "تم تحديث اللغة",
};

const catalogs: Record<AppLanguage, Dict> = { ar, en };

export function translate(
  lang: AppLanguage,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = catalogs[lang]?.[key] ?? catalogs.ar[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    raw,
  );
}

export function applyDocumentLanguage(lang: AppLanguage) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
}

export const EN_MONTH_NAMES: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};
