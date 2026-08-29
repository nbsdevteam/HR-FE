import { useCallback, useMemo, useState } from "react";
import { CheckCircle, Clock, Shield, Trash2 } from "lucide-react";
import { useAuditLog } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import DataTable from "@/shared/components/DataTable";
import LoadingState from "@/shared/components/LoadingState";
import StatCard from "@/shared/components/StatCard";
import SearchInput from "@/shared/components/SearchInput";
import Select from "@/shared/components/Select";
import { actionLabels, entityLabels } from "../data/auditMeta";
import { auditCardCls } from "../styles";
import AuditLogRow from "./AuditLogRow";
import { selectStyle } from "@/styles/sharedClasses";

const PAGE_LIMIT = 100;

const AuditTrailTab = () => {
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { logs, loading } = useAuditLog({
    action: filterAction || undefined,
    entityType: filterEntity || undefined,
    limit: 300,
  });

  // one pass over logs instead of three (search filter + today count + action counts)
  const { filtered, todayLogs, actionCounts } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const q = searchQuery.trim();

    const result: typeof logs = [];
    const counts: Record<string, number> = {};
    let todayCount = 0;

    for (const l of logs) {
      if (new Date(l.created_at).toISOString().slice(0, 10) === todayStr)
        todayCount++;
      counts[l.action] = (counts[l.action] || 0) + 1;

      if (
        !q ||
        l.entity_label?.includes(q) ||
        l.actor_name.includes(q) ||
        l.entity_type.includes(q)
      ) {
        result.push(l);
      }
    }

    return { filtered: result, todayLogs: todayCount, actionCounts: counts };
  }, [logs, searchQuery]);

  const displayedLogs = useMemo(
    () => filtered.slice(0, PAGE_LIMIT),
    [filtered],
  );

  const stats = useMemo(
    () => [
      {
        label: arabicSource("common.total_records"),
        value: logs.length,
        icon: Shield,
      },
      { label: arabicSource("common.today"), value: todayLogs, icon: Clock },
      {
        label: arabicSource("auditcenter.creation_operations"),
        value: actionCounts.create || 0,
        icon: CheckCircle,
      },
      {
        label: arabicSource("auditcenter.deletions"),
        value: actionCounts.delete || 0,
        icon: Trash2,
      },
    ],
    [logs.length, todayLogs, actionCounts],
  );

  const toggleExpandedLog = useCallback((id: string) => {
    setExpandedLog((current) => (current === id ? null : id));
  }, []);

  const handleFilterActionChange = useCallback(
    (value: string): void => {
      setFilterAction(value);
    },
    [setFilterAction],
  );

  const handleFilterEntityChange = useCallback(
    (value: string): void => {
      setFilterEntity(value);
    },
    [setFilterEntity],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats?.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            index={index}
            iconBox={false}
            valueSize={20}
            valueMarginClassName=""
            labelSize={12}
          />
        ))}
      </div>

      <div className={auditCardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={arabicSource("auditcenter.search_records")}
            wrapperClassName="flex items-center gap-2 flex-1 min-w-[200px]"
            iconClassName="w-4 h-4 text-muted-foreground"
            inputClassName="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          <Select
            value={filterAction}
            onChange={handleFilterActionChange}
            blankLabel={arabicSource("auditcenter.all_procedures")}
            options={Object.entries(actionLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            className={selectStyle}
          />
          <Select
            value={filterEntity}
            onChange={handleFilterEntityChange}
            blankLabel={arabicSource("auditcenter.all_entities")}
            options={Object.entries(entityLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            className={selectStyle}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState
          wrapperClassName="flex items-center justify-center py-16"
          iconClassName="w-8 h-8 text-primary animate-spin"
        />
      ) : filtered.length === 0 ? (
        <div className={`${auditCardCls} text-center py-12`}>
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {arabicSource("auditcenter.no_audit_logs_found")}
          </p>
        </div>
      ) : (
        <div className={auditCardCls + " !p-0"}>
          <DataTable
            wrapperClassName={null}
            tableClassName="w-full text-sm"
            items={displayedLogs}
            header={
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("auditcenter.procedure")}
                </th>
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("auditcenter.entity")}
                </th>
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("common.description")}
                </th>
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("auditcenter.port")}
                </th>
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("common.date")}
                </th>
                <th className="text-start p-3 text-muted-foreground font-medium">
                  {arabicSource("auditcenter.details")}
                </th>
              </tr>
            }
            renderRow={(log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                isExpanded={expandedLog === log.id}
                onToggleExpanded={toggleExpandedLog}
              />
            )}
          />
          {filtered.length > PAGE_LIMIT && (
            <p className="text-center text-muted-foreground text-xs py-3 border-t border-border/20">
              {arabicSource(
                "auditcenter.the_first_100_records_of_a_parent_are_displayed",
              )}{" "}
              {filtered.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditTrailTab;
