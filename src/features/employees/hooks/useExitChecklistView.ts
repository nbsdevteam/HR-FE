import { useMemo } from "react";
import type { DbExitChecklistItem, DbExitProcess, ExitClearanceSection } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import type { ExitChecklistLine } from "../types/lifecycle";

export type ExitCategoryGroup = { cat: string; catLabel: string; items: ExitChecklistLine[] };

export type ExitChecklistView = {
  completedCount: number;
  totalCount: number;
  categorizedChecklist: ExitCategoryGroup[];
  itemNameById: ReadonlyMap<string, string>;
  sectionByCategory: ReadonlyMap<string, ExitClearanceSection>;
  /** Lines the signed-in user may tick by hand now: the backend allows it and no clearance section governs the line. */
  toggleableLineIds: ReadonlySet<string>;
};

/** The record's checklist grouped by category, with the clearance sections that govern them. */
export const useExitChecklistView = (
  proc: DbExitProcess,
  checklist: ExitChecklistLine[],
  exitItems: DbExitChecklistItem[],
  categoryLabels: Record<string, string>,
): ExitChecklistView => {
  const completedCount = useMemo(() => checklist.filter(c => c.is_completed).length, [checklist]);

  const exitItemById = useMemo(() => indexBy(exitItems, i => i.id), [exitItems]);

  const itemNameById = useMemo(
    () => new Map(exitItems.map(i => [i.id, i.name_ar])),
    [exitItems],
  );

  const sectionByCategory = useMemo(
    () => new Map(proc.clearance_sections.map(section => [section.category, section])),
    [proc.clearance_sections],
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

  const toggleableLineIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of checklist) {
      const category = exitItemById.get(line.checklist_item_id)?.category;
      if (line.can_toggle === true && !(category && sectionByCategory.has(category))) ids.add(line.id);
    }
    return ids;
  }, [checklist, exitItemById, sectionByCategory]);

  return {
    completedCount,
    totalCount: checklist.length,
    categorizedChecklist,
    itemNameById,
    sectionByCategory,
    toggleableLineIds,
  };
};
