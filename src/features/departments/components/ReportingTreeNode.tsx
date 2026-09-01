import { useRef } from "react";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgReportingNode } from "@/shared/hooks";
import { orgLabel } from "../utils/orgStructure";
import ReportingTreeChildren from "./ReportingTreeChildren";
import ReportingTreeEmployee from "./ReportingTreeEmployee";

/** The real establishment is 4 levels deep; 20 is a generous guard against a runaway render. */
const MAX_RENDER_DEPTH = 20;

type ReportingTreeNodeProps = {
  node: OrgReportingNode;
  depth: number;
};

/**
 * One node of the reporting-line tree: department, position and its
 * employees, all read from this node — never looked up from an ancestor,
 * since a reporting line can cross departments (task doc §3).
 */
const ReportingTreeNode = ({ node, depth }: ReportingTreeNodeProps) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const vacant = node.employee_count === 0;
  const departmentLabel = node.department_id
    ? orgLabel(node.department, node.department_ar)
    : t("hierarchy.no_department");

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={cardRef}
        className="relative z-[1] w-64 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm"
      >
        <header className="flex items-start gap-2 border-b border-border/40 bg-muted/10 px-3.5 py-2.5">
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-muted-foreground" style={{ fontSize: 10.5 }}>
              {departmentLabel}
            </p>
            <h3 className="truncate font-semibold" style={{ fontSize: 13.5 }}>
              {orgLabel(node.title, node.title_ar)}
            </h3>
          </div>
        </header>

        <div className="px-3.5 py-2.5">
          <p className="tabular-nums text-muted-foreground text-end" style={{ fontSize: 11.5 }}>
            {node.seats > 0
              ? t("hierarchy.filled_of_seats", { filled: node.employee_count, seats: node.seats })
              : t("hierarchy.n_employees", { count: node.employee_count })}
          </p>

          {vacant ? (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border border-dashed border-flag-hair bg-flag-bg px-2.5 py-0.5 text-flag"
                style={{ fontSize: 11 }}
              >
                {t("hierarchy.vacant")}
              </span>
              {node.seats > 0 && (
                <span className="text-muted-foreground" style={{ fontSize: 11.5 }}>
                  {t("hierarchy.n_vacant", { count: node.vacancies })}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1.5">
              {node.employees.map((employee) => (
                <ReportingTreeEmployee key={employee.employee_id} employee={employee} />
              ))}
              {/* Some seats filled, some not — say so rather than leaving it implied. */}
              {node.vacancies > 0 && (
                <p className="text-muted-foreground mt-1" style={{ fontSize: 11.5 }}>
                  {t("hierarchy.n_vacant", { count: node.vacancies })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && depth < MAX_RENDER_DEPTH && (
        <div className="pt-2">
          <ReportingTreeChildren parentRef={cardRef} nodes={node.children} depth={depth + 1} />
        </div>
      )}
    </div>
  );
};

export default ReportingTreeNode;
