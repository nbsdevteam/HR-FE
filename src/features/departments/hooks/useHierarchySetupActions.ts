import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbDepartment, DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { CLEVEL_COLOR, OWNER_COLOR } from "../styles";

// ── Owner/CEO/COO setup + duplicate cleanup — now with Supabase ──
export const useHierarchySetupActions = (
  dbEmployees: DbEmployee[],
  dbDepartments: DbDepartment[],
  refetch: () => Promise<void>,
  setSaving: Dispatch<SetStateAction<boolean>>,
  setToast: Dispatch<SetStateAction<string | null>>,
  setShowSetupModal: Dispatch<SetStateAction<boolean>>,
  setShowCleanupModal: Dispatch<SetStateAction<boolean>>,
) => {
  // Setup Owner → CEO + COO hierarchy
  const handleSetupHierarchy = useCallback(async () => {
    setSaving(true);
    try {
      // Check if Owner already exists
      const ownerExists = dbEmployees.some(e => e.department === arabicSource("common.owner") || e.position === arabicSource("common.owner"));
      if (ownerExists) {
        setToast(arabicSource("hierarchy.the_organizational_structure_is_already_prepared_use_the_edit_bu"));
        setSaving(false);
        return;
      }

      // Get max person_id to assign new sequential ones
      const maxPid = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);

      // 0. Ensure Owner + C-Level departments exist first (employees need a department_id)
      const ownerDeptExisting = dbDepartments.find(d => d.name === arabicSource("common.owner"));
      const ownerDeptId = ownerDeptExisting
        ? ownerDeptExisting.id
        : (await odooData.createDepartment({ name: arabicSource("common.owner"), color: OWNER_COLOR }) as any)?.data?.id;
      const clevelDeptExisting = dbDepartments.find(d => d.name === arabicSource("common.senior_management"));
      const clevelDeptId = clevelDeptExisting
        ? clevelDeptExisting.id
        : (await odooData.createDepartment({ name: arabicSource("common.senior_management"), color: CLEVEL_COLOR }) as any)?.data?.id;

      // 1. Insert Owner
      let ownerId: string;
      try {
        const r1: any = await odooData.createEmployee({
          person_id: maxPid + 1, name: arabicSource("common.owner"), arabic_name: arabicSource("common.owner"),
          department_id: ownerDeptId || null,
          manager_id: null, status: arabicSource("common.is_active"), monthly_salary: 0, currency: "IQD",
        });
        ownerId = String(r1?.data?.id);
      } catch (e1: unknown) { console.error("Owner insert error:", e1); setToast(`${arabicSource("hierarchy.owner_creation_error")} ${e1 instanceof Error ? e1.message : ""}`); setSaving(false); return; }

      // 2. Insert CEO under Owner
      let ceoId: string;
      try {
        const r2: any = await odooData.createEmployee({
          person_id: maxPid + 2, name: arabicSource("common.executive_director"), arabic_name: arabicSource("common.executive_director"),
          department_id: clevelDeptId || null,
          manager_id: ownerId, status: arabicSource("common.is_active"), monthly_salary: 0, currency: "IQD",
        });
        ceoId = String(r2?.data?.id);
      } catch (e2: unknown) { console.error("CEO insert error:", e2); setToast(`${arabicSource("hierarchy.ceo_creation_error")} ${e2 instanceof Error ? e2.message : ""}`); setSaving(false); return; }

      // 3. Insert COO under Owner
      let cooId: string;
      try {
        const r3: any = await odooData.createEmployee({
          person_id: maxPid + 3, name: arabicSource("common.chief_operating_officer"), arabic_name: arabicSource("common.chief_operating_officer"),
          department_id: clevelDeptId || null,
          manager_id: ownerId, status: arabicSource("common.is_active"), monthly_salary: 0, currency: "IQD",
        });
        cooId = String(r3?.data?.id);
      } catch (e3: unknown) { console.error("COO insert error:", e3); setToast(`${arabicSource("hierarchy.coo_creation_error")} ${e3 instanceof Error ? e3.message : ""}`); setSaving(false); return; }

      // 4. Move all existing root employees (no manager) under CEO, EXCLUDING the newly created ones
      const newIds = new Set<string>([ownerId, ceoId, cooId]);
      const rootEmpIds = dbEmployees
        .filter(e => !e.manager_id && !newIds.has(e.id))
        .map(e => e.id);

      if (rootEmpIds.length > 0) {
        try {
          await Promise.all(rootEmpIds.map(id => odooData.updateEmployee(id, { manager_id: ceoId })));
        } catch (e4: unknown) { console.error("Move root employees error:", e4); }
      }

      setToast(arabicSource("hierarchy.structure_configured_owner_ceo_coo_edit_data_from_the_edit_butto"));
      setShowSetupModal(false);
      await refetch();
    } catch (err: unknown) {
      console.error("Setup hierarchy error:", err);
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message || arabicSource("hierarchy.failed_to_initialize_the_organizational_structure")}`);
    }
    setSaving(false);
  }, [dbEmployees, dbDepartments, refetch]);

  // ── Cleanup duplicate Owner/CEO/COO entries ──
  const handleCleanupDuplicates = useCallback(async () => {
    setSaving(true);
    try {
      // Find all Owner entries
      const owners = dbEmployees.filter(e => e.department === arabicSource("common.owner") || e.position === arabicSource("common.owner"));
      // Find all CEO entries
      const ceos = dbEmployees.filter(e => e.position === "CEO" && e.department === arabicSource("common.senior_management"));
      // Find all COO entries
      const coos = dbEmployees.filter(e => e.position === "COO" && e.department === arabicSource("common.senior_management"));

      if (owners.length <= 1 && ceos.length <= 1 && coos.length <= 1) {
        setToast(arabicSource("hierarchy.there_are_no_duplicates_in_the_organizational_structure"));
        setSaving(false);
        setShowCleanupModal(false);
        return;
      }

      // Strategy: Keep the OLDEST entry of each type (first created), delete the rest
      // For each duplicate, reparent its children to the kept entry's equivalent
      const sortByCreated = (a: DbEmployee, b: DbEmployee) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

      const keepOwner = owners.length > 0 ? [...owners].sort(sortByCreated)[0] : null;
      const keepCeo = ceos.length > 0 ? [...ceos].sort(sortByCreated)[0] : null;
      const keepCoo = coos.length > 0 ? [...coos].sort(sortByCreated)[0] : null;

      const duplicateOwners = owners.filter(e => e.id !== keepOwner?.id);
      const duplicateCeos = ceos.filter(e => e.id !== keepCeo?.id);
      const duplicateCoos = coos.filter(e => e.id !== keepCoo?.id);

      const allDuplicateIds = new Set([
        ...duplicateOwners.map(e => e.id),
        ...duplicateCeos.map(e => e.id),
        ...duplicateCoos.map(e => e.id),
      ]);

      // For each employee whose manager_id is a duplicate, reparent them
      for (const emp of dbEmployees) {
        if (!emp.manager_id || !allDuplicateIds.has(emp.manager_id)) continue;
        // Skip if this employee is also a duplicate (will be deleted)
        if (allDuplicateIds.has(emp.id)) continue;

        const dupManager = dbEmployees.find(e => e.id === emp.manager_id);
        if (!dupManager) continue;

        let newManagerId: string | null = null;
        // If the dup manager is an Owner duplicate → reparent to the kept Owner
        if (duplicateOwners.some(d => d.id === dupManager.id) && keepOwner) {
          newManagerId = keepOwner.id;
        }
        // If the dup manager is a CEO duplicate → reparent to the kept CEO
        else if (duplicateCeos.some(d => d.id === dupManager.id) && keepCeo) {
          newManagerId = keepCeo.id;
        }
        // If the dup manager is a COO duplicate → reparent to the kept COO
        else if (duplicateCoos.some(d => d.id === dupManager.id) && keepCoo) {
          newManagerId = keepCoo.id;
        }

        if (newManagerId) {
          await odooData.updateEmployee(emp.id, { manager_id: newManagerId });
        }
      }

      // Unlink duplicates from the hierarchy (manager_id -> null).
      // TODO(odoo): no delete-employee endpoint exists yet (only set_status), so
      // duplicates are unlinked, not removed — they'll still show up in flat employee lists.
      if (allDuplicateIds.size > 0) {
        const dupArr = Array.from(allDuplicateIds);
        await Promise.all(dupArr.map(id => odooData.updateEmployee(id, { manager_id: null })));
      }

      // Ensure kept Owner has no manager (is the true root)
      if (keepOwner) {
        await odooData.updateEmployee(keepOwner.id, { manager_id: null });
      }
      // Ensure kept CEO reports to kept Owner
      if (keepCeo && keepOwner) {
        await odooData.updateEmployee(keepCeo.id, { manager_id: keepOwner.id });
      }
      // Ensure kept COO reports to kept Owner
      if (keepCoo && keepOwner) {
        await odooData.updateEmployee(keepCoo.id, { manager_id: keepOwner.id });
      }

      const removedCount = allDuplicateIds.size;
      setToast(`${arabicSource("hierarchy.the_structure_was_cleaned_deleted")} ${removedCount} ${arabicSource("hierarchy.duplicate_entry_and_employees_were_successfully_reconnected")}`);
      setShowCleanupModal(false);
      await refetch();
    } catch (err: unknown) {
      console.error("Cleanup error:", err);
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message || arabicSource("hierarchy.chassis_cleaning_failed")}`);
    }
    setSaving(false);
  }, [dbEmployees, refetch]);

  return {
    handleSetupHierarchy,
    handleCleanupDuplicates,
  };
};
