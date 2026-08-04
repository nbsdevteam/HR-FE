import { useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, Shield, Search, Loader2, Check, X, Trash2,
  AlertTriangle, ClipboardCheck, Clock, Eye,
  FileText, Settings,
  Info, CheckCircle, XCircle, Edit2, Download, Upload, LogIn,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { isOdooBackend } from "../lib/api/client";
import * as odooData from "../lib/api/odooData";
import {
  useNotifications, useAuditLog, useEmployees,
  type DbNotification, type DbAuditLog, empDisplayName,
} from "../lib/hooks";

const actionLabels: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  approve: "موافقة",
  reject: "رفض",
  login: "تسجيل دخول",
  export: "تصدير",
  import: "استيراد",
  status_change: "تغيير حالة",
  configuration_change: "تغيير إعداد",
};

const actionIcons: Record<string, any> = {
  create: CheckCircle,
  update: Edit2,
  delete: Trash2,
  approve: Check,
  reject: XCircle,
  login: LogIn,
  export: Download,
  import: Upload,
  status_change: ClipboardCheck,
  configuration_change: Settings,
};

const actionColors: Record<string, string> = {
  create: "text-emerald-400",
  update: "text-blue-400",
  delete: "text-red-400",
  approve: "text-emerald-400",
  reject: "text-red-400",
  login: "text-primary",
  export: "text-blue-400",
  import: "text-amber-400",
  status_change: "text-amber-400",
  configuration_change: "text-purple-400",
};

const entityLabels: Record<string, string> = {
  employee: "موظف",
  attendance: "حضور",
  leave: "إجازة",
  payroll: "رواتب",
  contract: "عقد",
  document: "وثيقة",
  loan: "قرض",
  warning: "إنذار",
  report: "تقرير",
  configuration: "إعداد",
  module: "وحدة",
  shift: "وردية",
  department: "قسم",
  approval: "موافقة",
  exit_process: "انتهاء خدمة",
  notification: "إشعار",
};

const notifTypeColors: Record<string, string> = {
  info: "border-blue-500/30 bg-blue-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  action: "border-primary/30 bg-primary/10",
};

const notifTypeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  action: Bell,
};

export function AuditCenter() {
  const [activeTab, setActiveTab] = useState<"notifications" | "audit">("notifications");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-gold">مركز الإشعارات والسجلات</h1>
        <p className="text-muted-foreground mt-1">الإشعارات وسجل التدقيق لجميع العمليات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-1">
        {[
          { key: "notifications" as const, label: "الإشعارات", icon: Bell },
          { key: "audit" as const, label: "سجل التدقيق", icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-primary/10 border border-b-0 border-primary/30 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "notifications" ? <NotificationsTab /> : <AuditTrailTab />}
    </div>
  );
}

// ——— Notifications Tab ———
function NotificationsTab() {
  const { notifications, unreadCount, loading, refetch } = useNotifications();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterCategory !== "all" && n.category !== filterCategory) return false;
      if (searchQuery && !n.title.includes(searchQuery) && !(n.body || "").includes(searchQuery)) return false;
      return true;
    });
  }, [notifications, filterType, filterCategory, searchQuery]);

  const markRead = async (id: string) => {
    if (isOdooBackend()) {
      await odooData.markNotificationRead(id);
    } else {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    refetch();
  };

  const markAllRead = async () => {
    if (isOdooBackend()) {
      await odooData.markAllNotificationsRead();
    } else {
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    }
    refetch();
  };

  const dismiss = async (id: string) => {
    if (isOdooBackend()) {
      await odooData.dismissNotification(id);
    } else {
      await supabase.from("notifications").update({ is_dismissed: true }).eq("id", id);
    }
    refetch();
  };

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="بحث في الإشعارات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="all">جميع الأنواع</option>
            <option value="info">معلومات</option>
            <option value="warning">تحذير</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
            <option value="action">إجراء مطلوب</option>
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="all">جميع الفئات</option>
            <option value="system">النظام</option>
            <option value="leave">إجازات</option>
            <option value="attendance">حضور</option>
            <option value="payroll">رواتب</option>
            <option value="contract">عقود</option>
            <option value="document">وثائق</option>
            <option value="approval">موافقات</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer text-sm"
            >
              <Check className="w-4 h-4" />
              قراءة الكل ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardCls} text-center py-12`}>
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const TypeIcon = notifTypeIcons[n.type] || Bell;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  n.is_read
                    ? "bg-card/20 border-border/30"
                    : notifTypeColors[n.type] || "border-border/40 bg-card/30"
                }`}
              >
                <div className={`mt-0.5 ${
                  n.type === "warning" ? "text-amber-400" :
                  n.type === "error" ? "text-red-400" :
                  n.type === "success" ? "text-emerald-400" :
                  "text-primary"
                }`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${n.is_read ? "text-foreground/70" : "text-foreground font-medium"}`}>{n.title}</p>
                      {n.body && <p className="text-muted-foreground text-xs mt-1">{n.body}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title="تعيين كمقروء"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="إزالة"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{n.category}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">{new Date(n.created_at).toLocaleString("ar-IQ")}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ——— Audit Trail Tab ———
function AuditTrailTab() {
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { logs, loading, refetch } = useAuditLog({
    action: filterAction || undefined,
    entityType: filterEntity || undefined,
    limit: 300,
  });

  const filtered = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter(l =>
      l.entity_label?.includes(searchQuery) ||
      l.actor_name.includes(searchQuery) ||
      l.entity_type.includes(searchQuery)
    );
  }, [logs, searchQuery]);

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

  // Stats
  const todayLogs = logs.filter(l => {
    const logDate = new Date(l.created_at).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return logDate === today;
  }).length;

  const actionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach(l => { map[l.action] = (map[l.action] || 0) + 1; });
    return map;
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي السجلات", value: logs.length, icon: Shield },
          { label: "اليوم", value: todayLogs, icon: Clock },
          { label: "عمليات إنشاء", value: actionCounts.create || 0, icon: CheckCircle },
          { label: "عمليات حذف", value: actionCounts.delete || 0, icon: Trash2 },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                  <span className="text-gradient-gold text-xl">{stat.value}</span>
                </div>
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="بحث في السجلات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value); }}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="">جميع الإجراءات</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterEntity}
            onChange={e => { setFilterEntity(e.target.value); }}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          >
            <option value="">جميع الكيانات</option>
            {Object.entries(entityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardCls} text-center py-12`}>
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد سجلات تدقيق</p>
        </div>
      ) : (
        <div className={cardCls + " !p-0"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="text-start p-3 text-muted-foreground font-medium">الإجراء</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">الكيان</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">الوصف</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">المنفذ</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">التاريخ</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((log, i) => {
                  const ActionIcon = actionIcons[log.action] || FileText;
                  const colorCls = actionColors[log.action] || "text-muted-foreground";
                  const isExpanded = expandedLog === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr className="border-b border-border/20 hover:bg-muted/10">
                        <td className="p-3">
                          <div className={`flex items-center gap-2 ${colorCls}`}>
                            <ActionIcon className="w-4 h-4" />
                            <span>{actionLabels[log.action] || log.action}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-muted/30 text-muted-foreground text-xs">
                            {entityLabels[log.entity_type] || log.entity_type}
                          </span>
                        </td>
                        <td className="p-3 text-foreground">{log.entity_label || "—"}</td>
                        <td className="p-3 text-muted-foreground">{log.actor_name}</td>
                        <td className="p-3 text-muted-foreground text-xs" dir="ltr">
                          {new Date(log.created_at).toLocaleString("ar-IQ")}
                        </td>
                        <td className="p-3">
                          {log.details && Object.keys(log.details).length > 0 && (
                            <button
                              onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                              className="p-1 rounded text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-3 bg-muted/10">
                            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap" dir="ltr">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <p className="text-center text-muted-foreground text-xs py-3 border-t border-border/20">
              يتم عرض أول 100 سجل من أصل {filtered.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
