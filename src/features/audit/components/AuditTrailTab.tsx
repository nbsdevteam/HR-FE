import { useMemo, useState } from "react";
import { CheckCircle, Clock, Loader2, Search, Shield, Trash2 } from "lucide-react";
import { useAuditLog } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { actionLabels, entityLabels } from "../data/auditMeta";
import { auditCardCls } from "../styles";
import { AuditLogRow } from "./AuditLogRow";
import { AuditStatCard } from "./AuditStatCard";

export function AuditTrailTab() {
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { logs, loading } = useAuditLog({
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

  const stats = [
    { label: arabicSource("common.total_records"), value: logs.length, icon: Shield },
    { label: arabicSource("common.today"), value: todayLogs, icon: Clock },
    { label: arabicSource("auditcenter.creation_operations"), value: actionCounts.create || 0, icon: CheckCircle },
    { label: arabicSource("auditcenter.deletions"), value: actionCounts.delete || 0, icon: Trash2 },
  ];

  const toggleExpandedLog = (id: string) => {
    setExpandedLog((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <AuditStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} index={index} />
        ))}
      </div>

      <div className={auditCardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input placeholder={arabicSource("auditcenter.search_records")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm">
            <option value="">{arabicSource("auditcenter.all_procedures")}</option>
            {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm">
            <option value="">{arabicSource("auditcenter.all_entities")}</option>
            {Object.entries(entityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className={`${auditCardCls} text-center py-12`}>
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{arabicSource("auditcenter.no_audit_logs_found")}</p>
        </div>
      ) : (
        <div className={auditCardCls + " !p-0"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("auditcenter.procedure")}</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("auditcenter.entity")}</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("common.description")}</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("auditcenter.port")}</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("common.date")}</th>
                  <th className="text-start p-3 text-muted-foreground font-medium">{arabicSource("auditcenter.details")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((log) => (
                  <AuditLogRow key={log.id} log={log} isExpanded={expandedLog === log.id} onToggleExpanded={toggleExpandedLog} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <p className="text-center text-muted-foreground text-xs py-3 border-t border-border/20">
              {arabicSource("auditcenter.the_first_100_records_of_a_parent_are_displayed")} {filtered.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
