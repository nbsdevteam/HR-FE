import { useMemo } from "react";
import { ChevronRight, ClipboardList, LogOut } from "lucide-react";
import { empDisplayName, type DbEmployee, type DbExitChecklistItem, type DbExitProcess } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitChecklistLine } from "../types/lifecycle";
import ExitChecklistCategoryGroup from "./ExitChecklistCategoryGroup";

type ExitProcessDetailViewProps = {
  proc: DbExitProcess;
  emp: DbEmployee | undefined;
  checklist: ExitChecklistLine[];
  exitItems: DbExitChecklistItem[];
  categoryLabels: Record<string, string>;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  cardCls: string;
  onBack: () => void;
  onStatusUpdate: (processId: string, status: string) => void;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

const ExitProcessDetailView = ({
  proc, emp, checklist, exitItems, categoryLabels, exitTypeLabels, statusLabels, statusColors, cardCls,
  onBack, onStatusUpdate, onChecklistToggle,
}: ExitProcessDetailViewProps) => {
  const completedCount = useMemo(() => checklist.filter(c => c.is_completed).length, [checklist]);
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const exitItemById = useMemo(() => indexBy(exitItems, i => i.id), [exitItems]);

  const itemNameById = useMemo(
    () => new Map(exitItems.map(i => [i.id, i.name_ar])),
    [exitItems],
  );

  /** One grouping pass over the checklist instead of a full filter per category. */
  const categorizedChecklist = useMemo(() => {
    const byCategory = new Map<string, ExitChecklistLine[]>();
    for (const line of checklist) {
      const category = exitItemById.get(line.checklist_item_id)?.category;
      if (!category) continue;
      const bucket = byCategory.get(category);
      if (bucket) bucket.push(line);
      else byCategory.set(category, [line]);
    }
    return Object.entries(categoryLabels)
      .map(([cat, catLabel]) => ({ cat, catLabel, items: byCategory.get(cat) ?? [] }))
      .filter(group => group.items.length > 0);
  }, [categoryLabels, checklist, exitItemById]);

  const handleStatusUpdateClick = (status: string) => (): void => {
    onStatusUpdate(proc.id, status);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ChevronRight className="w-4 h-4" /> {arabicSource("lifecycle.return")}
      </button>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <LogOut className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-foreground">{emp ? empDisplayName(emp) : "—"}</h2>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            {exitTypeLabels[proc.exit_type] || proc.exit_type} — {proc.exit_date}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <span className={`px-3 py-1 rounded-md border ${statusColors[proc.status] || ""}`} style={{ fontSize: 12 }}>
            {statusLabels[proc.status] || proc.status}
          </span>
        </div>
      </div>

      {/* Process Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${cardCls} p-4`}>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.end_of_service_benefits")}</p>
          <p className="text-gradient-gold mt-1" style={{ fontSize: 22 }} dir="ltr">
            {proc.eos_amount ? `${formatNumber(Number(proc.eos_amount))} ${proc.eos_currency}` : "—"}
          </p>
        </div>
        <div className={`${cardCls} p-4`}>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.last_working_day")}</p>
          <p className="text-foreground mt-1" style={{ fontSize: 16 }} dir="ltr">{proc.last_working_day || proc.exit_date}</p>
        </div>
        <div className={`${cardCls} p-4`}>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.disclaimer")}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-foreground" style={{ fontSize: 16 }}>{completedCount}/{totalCount}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/30">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {proc.status !== "completed" && proc.status !== "cancelled" && (
        <div className="flex gap-2">
          {proc.status === "initiated" && (
            <button onClick={handleStatusUpdateClick("in_progress")} className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs cursor-pointer hover:bg-amber-500/30">{arabicSource("common.initiate_procedures")}</button>
          )}
          {proc.status === "in_progress" && (
            <button onClick={handleStatusUpdateClick("clearance")} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs cursor-pointer hover:bg-blue-500/30">{arabicSource("common.disclaimer")}</button>
          )}
          {proc.status === "clearance" && (
            <button onClick={handleStatusUpdateClick("settlement")} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs cursor-pointer hover:bg-purple-500/30">{arabicSource("lifecycle.financial_settlement")}</button>
          )}
          {proc.status === "settlement" && (
            <button onClick={handleStatusUpdateClick("completed")} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs cursor-pointer hover:bg-emerald-500/30">{arabicSource("lifecycle.complete")}</button>
          )}
          <button onClick={handleStatusUpdateClick("cancelled")} className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-xs cursor-pointer hover:bg-destructive/20">{arabicSource("common.cancel")}</button>
        </div>
      )}

      {/* Checklist */}
      <div className={`${cardCls} p-5`}>
        <h3 className="text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          {arabicSource("lifecycle.disclaimer_list")}
        </h3>
        {categorizedChecklist.map(({ cat, catLabel, items }) => (
          <ExitChecklistCategoryGroup
            key={cat}
            catLabel={catLabel}
            items={items}
            itemNameById={itemNameById}
            onChecklistToggle={onChecklistToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default ExitProcessDetailView;
