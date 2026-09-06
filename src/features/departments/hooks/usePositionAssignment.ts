import { useState, useCallback, useMemo, useEffect } from "react";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import { localizedName, useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { PendingAssignmentUndo, PositionAssignmentSnapshot } from "../types";

/** How long the "… — Undo" toast stays up. Dragging has no confirm step; this is it. */
const UNDO_WINDOW_MS = 8000;

const snapshotOf = (employee: DbEmployee): PositionAssignmentSnapshot => ({
  position_id: employee.position_id,
  department_id: employee.department_id,
  department: employee.department,
  manager_id: employee.manager_id,
});

type Options = {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  positions: DbPosition[];
  refetch: () => void;
  refetchPositions: () => void;
  onToast: (message: string) => void;
};

/**
 * Drag-to-assign with an optimistic screen update and an undo window.
 *
 * The drop is painted immediately by overlaying the target employee's record,
 * then reconciled against the refetch. Nothing about the API contract changes —
 * both the assignment and its undo are the same `updateEmployee` call.
 */
export const usePositionAssignment = ({
  dbEmployees,
  dbDepartments,
  positions,
  refetch,
  refetchPositions,
  onToast,
}: Options) => {
  const [overrides, setOverrides] = useState<Record<string, PositionAssignmentSnapshot>>({});
  const [inFlight, setInFlight] = useState(0);
  const [undoEntry, setUndoEntry] = useState<PendingAssignmentUndo | null>(null);

  const isArabic = useIsArabicLanguage();
  const updateEmployeeMutation = useOdooMutation(
    ({ id, updates }: { id: string; updates: Record<string, unknown> }) => odooData.updateEmployee(id, updates),
    ["employees", "positions"],
  );

  /** Employee list with the not-yet-reconciled drops applied, so the UI never waits. */
  const effectiveEmployees = useMemo(() => {
    const pending = Object.keys(overrides);
    if (pending.length === 0) return dbEmployees;
    return dbEmployees.map((employee) =>
      overrides[employee.id] ? { ...employee, ...overrides[employee.id] } : employee,
    );
  }, [dbEmployees, overrides]);

  const commit = useCallback(
    async (employeeId: string, next: PositionAssignmentSnapshot): Promise<boolean> => {
      setOverrides((current) => ({ ...current, [employeeId]: next }));
      setInFlight((count) => count + 1);
      try {
        await updateEmployeeMutation.mutateAsync({
          id: employeeId,
          updates: {
            designation_id: next.position_id,
            department_id: next.department_id,
            manager_id: next.manager_id,
          },
        });
        // The `employees`/`positions` cache invalidation triggered above
        // doesn't resolve back to here, so the override is held until the
        // reconciliation effect below sees the server agree.
        return true;
      } catch (err: unknown) {
        // Dropping the override hands the row straight back to the untouched
        // server record, so a failed assignment never lingers on screen.
        setOverrides((current) => {
          const { [employeeId]: _discarded, ...rest } = current;
          return rest;
        });
        const message = err instanceof Error ? err.message : "";
        onToast(`${arabicSource("common.error_2")} ${message}`);
        return false;
      } finally {
        setInFlight((count) => Math.max(0, count - 1));
      }
    },
    [updateEmployeeMutation.mutateAsync, onToast],
  );

  const assignEmployee = useCallback(
    async (employeeId: string, positionId: string): Promise<void> => {
      const position = positions.find((candidate: DbPosition) => candidate.id === positionId);
      const employee = effectiveEmployees.find((candidate) => candidate.id === employeeId);
      if (!position || !employee) return;

      // Backstop only — a full row already refuses the drop before it happens.
      const assignedCount = effectiveEmployees.filter(
        (candidate) => candidate.position_id === positionId,
      ).length;
      if (assignedCount >= position.max_headcount) {
        onToast(arabicSource("hierarchy.error_position_is_full_cannot_assign_more"));
        return;
      }

      const previous = snapshotOf(employee);
      const department = dbDepartments.find((candidate) => candidate.id === position.department_id);

      // Manager is inherited from whoever holds the parent position, as before.
      let managerId = previous.manager_id;
      if (position.reports_to_position_id) {
        const parentHolder = effectiveEmployees.find(
          (candidate) => candidate.position_id === position.reports_to_position_id,
        );
        if (parentHolder) managerId = parentHolder.id;
      }

      setUndoEntry({
        employeeId,
        employeeName: empDisplayName(employee),
        // Captured in the reader's language — `title_ar`/`title_en` are backend
        // columns the DOM auto-translator has no entry for.
        positionTitle: localizedName(position.title_ar, position.title_en, isArabic),
        previous,
      });

      const assigned = await commit(employeeId, {
        position_id: positionId,
        department_id: department ? department.id : previous.department_id,
        department: department ? department.name : previous.department,
        manager_id: managerId,
      });
      // Nothing to take back if it never landed — let the error toast through.
      if (!assigned) setUndoEntry(null);
    },
    [positions, effectiveEmployees, dbDepartments, commit, onToast, isArabic],
  );

  const undoAssignment = useCallback(async (): Promise<void> => {
    if (!undoEntry) return;
    const { employeeId, previous } = undoEntry;
    setUndoEntry(null);
    const reverted = await commit(employeeId, previous);
    if (reverted) onToast(arabicSource("hierarchy.assignment_undone"));
  }, [undoEntry, commit, onToast]);

  useEffect(() => {
    if (!undoEntry) return;
    const timer = setTimeout(() => setUndoEntry(null), UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [undoEntry]);

  /** Retire an override as soon as the refetched record says the same thing. */
  useEffect(() => {
    setOverrides((current) => {
      if (Object.keys(current).length === 0) return current;
      const next = { ...current };
      let reconciled = false;
      dbEmployees.forEach((employee) => {
        if (next[employee.id]?.position_id === employee.position_id) {
          delete next[employee.id];
          reconciled = true;
        }
      });
      return reconciled ? next : current;
    });
  }, [dbEmployees]);

  return {
    effectiveEmployees,
    assigning: inFlight > 0,
    undoEntry,
    assignEmployee,
    undoAssignment,
  };
};
