import { Fragment } from "react";
import { Eye, FileText } from "lucide-react";
import type { DbAuditLog } from "@/shared/hooks";
import { Button } from "@/shared/components";
import { formatDateTime } from "@/i18n/format";
import { actionIcons, actionLabels, entityLabels } from "../data/auditMeta";
import { actionColors } from "../styles";

type AuditLogRowProps = {
  log: DbAuditLog;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
};

const AuditLogRow = ({ log, isExpanded, onToggleExpanded }: AuditLogRowProps) => {
  const ActionIcon = actionIcons[log.action] || FileText;
  const colorCls = actionColors[log.action] || "text-muted-foreground";
  const hasDetails = log.details && Object.keys(log.details).length > 0;

  const handleToggleExpandedClick = (): void => {
    onToggleExpanded(log.id);
  };

  return (
    <Fragment>
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
          {formatDateTime(log.created_at)}
        </td>
        <td className="p-3">
          {hasDetails && (
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={Eye}
              onClick={handleToggleExpandedClick}
              className="p-1 text-muted-foreground hover:text-primary"
            />
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
};

export default AuditLogRow;
