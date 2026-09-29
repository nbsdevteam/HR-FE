import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronRight, ClipboardList, LogOut, Pencil } from "lucide-react";
import { Button } from "@/shared/components";
import { empDisplayName, type DbEmployee, type DbExitChecklistItem, type DbExitProcess, type ExitStatus } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";
import type { ExitChecklistLine } from "../types/lifecycle";
import ExitChecklistCategoryGroup from "./ExitChecklistCategoryGroup";
import ExitClearanceNotice from "./ExitClearanceNotice";
import ExitProcessEditPanel, { type ExitEditPayload } from "./ExitProcessEditPanel";
import ExitProcessSummaryCards from "./ExitProcessSummaryCards";
import ExitStageActions from "./ExitStageActions";

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
  inputCls: string;
  busy: boolean;
  onBack: () => void;
  onTransition: (processId: string, status: ExitStatus) => void;
  onEditSave: (processId: string, payload: ExitEditPayload) => Promise<boolean>;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

const ExitProcessDetailView = ({
  proc, emp, checklist, exitItems, categoryLabels, exitTypeLabels, statusLabels, statusColors, cardCls,
  inputCls, busy, onBack, onTransition, onEditSave, onChecklistToggle,
}: ExitProcessDetailViewProps) => {
  const [editing, setEditing] = useState(false);

  const completedCount = useMemo(() => checklist.filter(c => c.is_completed).length, [checklist]);

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

  const handleTransition = useCallback((target: ExitStatus): void => {
    onTransition(proc.id, target);
  }, [onTransition, proc.id]);

  const handleEditOpen = useCallback((): void => setEditing(true), []);
  const handleEditCancel = useCallback((): void => setEditing(false), []);
  const handleEditSave = useCallback(async (payload: ExitEditPayload): Promise<void> => {
    if (await onEditSave(proc.id, payload)) setEditing(false);
  }, [onEditSave, proc.id]);

  const employeeName = emp ? empDisplayName(emp) : proc.employee_name || "—";

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
          <h2 className="text-foreground" dir="auto">{employeeName}</h2>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            {exitTypeLabels[proc.exit_type] || proc.exit_type} — {proc.exit_date}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          {proc.editable && !editing && (
            <Button variant="outline" size="sm" icon={Pencil} onClick={handleEditOpen}>
              {arabicSource("common.edit")}
            </Button>
          )}
          <span className={`px-3 py-1 rounded-md border ${statusColors[proc.status] || ""}`} style={{ fontSize: 12 }} data-exit-status={proc.status}>
            {statusLabels[proc.status] || proc.status}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <ExitProcessEditPanel
            proc={proc}
            exitTypeLabels={exitTypeLabels}
            saving={busy}
            cardCls={cardCls}
            inputCls={inputCls}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        )}
      </AnimatePresence>

      <ExitProcessSummaryCards proc={proc} completedCount={completedCount} totalCount={checklist.length} cardCls={cardCls} />

      <ExitClearanceNotice proc={proc} cardCls={cardCls} />

      <ExitStageActions
        allowedTransitions={proc.allowed_transitions}
        transitionBlockers={proc.transition_blockers}
        busy={busy}
        onTransition={handleTransition}
      />

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
