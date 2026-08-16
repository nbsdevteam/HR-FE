import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, ChevronDown, Minus, Plus, Maximize2, Search, Printer, Download,
  Move, X, UserPlus, Trash2, Building2, UserCheck, Briefcase, ChevronLeft,
  Loader2, AlertTriangle, Link2, Crown, Edit2, Network, GripVertical, Save, ChevronRight as ChevronRightIcon, GitBranch
} from "lucide-react";
import { useHierarchyData, usePositions, empDisplayName } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import i18n, { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { formatDate } from "@/i18n/format";
import { translateArabicSource } from "@/i18n/legacy";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { OrgNode, PositionNode } from "../types";
import { avatarColors, CLEVEL_COLOR, defaultDeptColorMap, OWNER_COLOR } from "../styles";
import {
  buildOrgTree,
  buildOrgTreeFromPositions,
  buildPositionTree,
  countDescendants,
  findAncestorIds,
  findParentOf,
  flattenTree,
  getDescendantIds,
  getUnlinkedEmployees,
  pickUniqueColor,
} from "../utils/hierarchyTree";
import { OrgCard } from "../components/OrgCard";
import { AddEmployeeModal } from "../components/AddEmployeeModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { EditEmployeeModal } from "../components/EditEmployeeModal";
import { DetailPanel } from "../components/DetailPanel";
import { SearchResults } from "../components/SearchResults";
import { UnlinkedPanel } from "../components/UnlinkedPanel";
import { PositionCard } from "../components/PositionCard";
import { DraggableEmployeeCard } from "../components/DraggableEmployeeCard";
import { PositionsView } from "../components/PositionsView";



// ── Org Card ──



// ── Add Employee Modal ──



// ── Delete Confirmation ──



// ── Edit Employee Modal ──



// ── Detail Panel ──



// ── Search Results ──



// ── Unlinked Employees Panel ──



// ══════════════════════════════════════════════════════════════
// ── Positions & Drag-and-Drop Assignment View ──
// ══════════════════════════════════════════════════════════════







// ══════════════════════════════════════════════════
// ── Main Hierarchy Page ──
// ══════════════════════════════════════════════════

export function Hierarchy() {
  const { employees: dbEmployees, departments: dbDepartments, loading: dbLoading, refetch } = useHierarchyData();
  const { positions: dbPositions, loading: positionsLoading, refetch: refetchPositions } = usePositions();

  // Build tree from POSITIONS (single source of truth)
  const { tree: orgTree, deptColors } = useMemo(() => {
    // If positions exist, use position-based tree
    if (dbPositions.length > 0) {
      return buildOrgTreeFromPositions(dbPositions, dbEmployees, dbDepartments);
    }
    // Fallback to legacy manager_id tree for backward compatibility
    if (dbEmployees.length === 0) return {
      tree: { id: 0, dbId: "__root__", name: arabicSource("common.foundation"), initials: arabicSource("common.m"), position: arabicSource("common.senior_management"), department: arabicSource("common.senior_management"), color: "#8B5CF6", photo: null, email: null, children: [] } as OrgNode,
      deptColors: defaultDeptColorMap,
    };
    return buildOrgTree(dbEmployees, dbDepartments);
  }, [dbEmployees, dbDepartments, dbPositions]);

  const unlinkedEmps = useMemo(() => getUnlinkedEmployees(dbEmployees), [dbEmployees]);

  const [viewMode, setViewMode] = useState<"tree" | "positions">("tree");
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalManagerId, setAddModalManagerId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgNode | null>(null);
  const [editTarget, setEditTarget] = useState<OrgNode | null>(null);
  const [showUnlinked, setShowUnlinked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const [isDragging, setIsDragging] = useState(false);
  const [panEnabled, setPanEnabled] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const allNodes = useMemo(() => flattenTree(orgTree), [orgTree]);
  const departments = useMemo(() => {
    const s = new Set<string>();
    allNodes.forEach(n => s.add(n.department));
    dbDepartments.forEach(d => s.add(d.name));
    return Array.from(s);
  }, [allNodes, dbDepartments]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return allNodes.filter(n => n.name.includes(q) || n.position.includes(q) || n.department.includes(q));
  }, [searchQuery, allNodes]);

  const { searchMatchIds, highlightedIds } = useMemo(() => {
    const matchIds = new Set<number>();
    const ancestorIds = new Set<number>();
    if (focusedNodeId) {
      matchIds.add(focusedNodeId);
      findAncestorIds(orgTree, focusedNodeId).forEach(id => ancestorIds.add(id));
    } else if (searchQuery.trim() && searchResults.length > 0) {
      searchResults.forEach(n => {
        matchIds.add(n.id);
        findAncestorIds(orgTree, n.id).forEach(id => ancestorIds.add(id));
      });
    }
    return { searchMatchIds: matchIds, highlightedIds: ancestorIds };
  }, [searchQuery, searchResults, focusedNodeId, orgTree]);

  useEffect(() => {
    if (highlightedIds.size > 0 || searchMatchIds.size > 0) {
      setExpandedMap(prev => {
        const next = { ...prev };
        highlightedIds.forEach(id => { next[id] = true; });
        searchMatchIds.forEach(id => { next[id] = true; });
        return next;
      });
      setTimeout(() => {
        const first = searchMatchIds.values().next().value;
        if (first && containerRef.current) {
          const el = containerRef.current.querySelector(`[data-node-id="${first}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }, 350);
    }
  }, [highlightedIds, searchMatchIds]);

  // Initialize expand map when tree changes
  useEffect(() => {
    const init: Record<number, boolean> = {};
    function walk(n: OrgNode, d: number) { init[n.id] = d < 2; n.children.forEach(c => walk(c, d + 1)); }
    walk(orgTree, 0);
    setExpandedMap(init);
  }, [orgTree]);

  const toggleExpand = useCallback((id: number) => { setExpandedMap(p => ({ ...p, [id]: !p[id] })); }, []);

  const expandAll = useCallback(() => {
    const a: Record<number, boolean> = {};
    function walk(n: OrgNode) { a[n.id] = true; n.children.forEach(walk); }
    walk(orgTree); setExpandedMap(a);
  }, [orgTree]);

  const collapseAll = useCallback(() => {
    const a: Record<number, boolean> = {};
    function walk(n: OrgNode) { a[n.id] = false; n.children.forEach(walk); }
    walk(orgTree); a[orgTree.id] = true; setExpandedMap(a);
  }, [orgTree]);

  // ── CRUD handlers — now with Supabase ──

  const handleAddEmployee = useCallback(async (parentDbId: string, name: string, position: string, department: string) => {
    setSaving(true);
    const managerId = parentDbId === "__root__" ? null : parentDbId;
    const dept = dbDepartments.find(d => d.name === department);
    const pos = dbPositions.find(p => p.title_ar === position);
    const nextPid = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0) + 1;
    try {
      await odooData.createEmployee({
        name,
        arabic_name: name,
        person_id: nextPid,
        department_id: dept?.id || null,
        position_id: pos?.id || null,
        manager_id: managerId,
        status: arabicSource("common.is_active"),
        monthly_salary: 0,
        currency: "IQD",
      });
      setToast(`${arabicSource("common.added")}${name}${arabicSource("hierarchy.successfully_completed_the_organizational_structure")}`);
      await refetch();
    } catch (err: any) {
      console.error("Add employee error:", err);
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [refetch, dbDepartments, dbPositions, dbEmployees]);

  const handleDeleteEmployee = useCallback(async (node: OrgNode, reparent: boolean) => {
    if (node.dbId === "__root__") return;
    setSaving(true);

    // Find parent's dbId
    const parent = findParentOf(orgTree, node.id);
    const parentDbId = parent && parent.dbId !== "__root__" ? parent.dbId : null;

    if (reparent && node.children.length > 0) {
      // Move children's manager_id to this node's parent
      await Promise.all(node.children.map(c => odooData.updateEmployee(c.dbId, { manager_id: parentDbId })));
    } else if (!reparent && node.children.length > 0) {
      // Remove manager_id from all children (they become unlinked)
      await Promise.all(node.children.map(c => odooData.updateEmployee(c.dbId, { manager_id: null })));
    }

    // Remove this employee's manager_id (unlink from hierarchy)
    await odooData.updateEmployee(node.dbId, { manager_id: null });

    setDeleteTarget(null);
    setSelectedNode(null);
    setToast(arabicSource("hierarchy.the_employee_was_dismissed_from_the_organizational_structure"));
    await refetch();
    setSaving(false);
  }, [orgTree, refetch]);

  const handleEditEmployee = useCallback(async (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => {
    if (dbId === "__root__") return;
    setSaving(true);
    const odooUpdates: Record<string, any> = {};
    if (updates.name !== undefined) {
      odooUpdates.name = updates.name;
      odooUpdates.arabic_name = updates.name;
    }
    if (updates.position !== undefined) {
      const pos = dbPositions.find(p => p.title_ar === updates.position);
      odooUpdates.position_id = pos?.id || null;
    }
    if (updates.department !== undefined) {
      const dept = dbDepartments.find(d => d.name === updates.department);
      odooUpdates.department_id = dept?.id || null;
    }
    if (updates.manager_id !== undefined) odooUpdates.manager_id = updates.manager_id;
    try {
      await odooData.updateEmployee(dbId, odooUpdates);
      setToast(arabicSource("hierarchy.employee_data_has_been_updated_successfully"));
      setEditTarget(null);
      setSelectedNode(null);
      await refetch();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [refetch, dbDepartments, dbPositions]);

  const handleLinkEmployee = useCallback(async (empDbId: string, managerDbId: string) => {
    setSaving(true);
    try {
      await odooData.updateEmployee(empDbId, { manager_id: managerDbId });
      setToast(arabicSource("hierarchy.the_employee_has_been_successfully_linked_to_his_manager"));
      await refetch();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [refetch]);

  const handleAddDepartment = useCallback(async (name: string, color: string) => {
    const existing = dbDepartments.find(d => d.name === name);
    if (existing) {
      await odooData.updateDepartment(existing.id, { color });
    } else {
      await odooData.createDepartment({ name, color });
    }
  }, [dbDepartments]);

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
      } catch (e1: any) { console.error("Owner insert error:", e1); setToast(`${arabicSource("hierarchy.owner_creation_error")} ${e1?.message || ""}`); setSaving(false); return; }

      // 2. Insert CEO under Owner
      let ceoId: string;
      try {
        const r2: any = await odooData.createEmployee({
          person_id: maxPid + 2, name: arabicSource("common.executive_director"), arabic_name: arabicSource("common.executive_director"),
          department_id: clevelDeptId || null,
          manager_id: ownerId, status: arabicSource("common.is_active"), monthly_salary: 0, currency: "IQD",
        });
        ceoId = String(r2?.data?.id);
      } catch (e2: any) { console.error("CEO insert error:", e2); setToast(`${arabicSource("hierarchy.ceo_creation_error")} ${e2?.message || ""}`); setSaving(false); return; }

      // 3. Insert COO under Owner
      let cooId: string;
      try {
        const r3: any = await odooData.createEmployee({
          person_id: maxPid + 3, name: arabicSource("common.chief_operating_officer"), arabic_name: arabicSource("common.chief_operating_officer"),
          department_id: clevelDeptId || null,
          manager_id: ownerId, status: arabicSource("common.is_active"), monthly_salary: 0, currency: "IQD",
        });
        cooId = String(r3?.data?.id);
      } catch (e3: any) { console.error("COO insert error:", e3); setToast(`${arabicSource("hierarchy.coo_creation_error")} ${e3?.message || ""}`); setSaving(false); return; }

      // 4. Move all existing root employees (no manager) under CEO, EXCLUDING the newly created ones
      const newIds = new Set<string>([ownerId, ceoId, cooId]);
      const rootEmpIds = dbEmployees
        .filter(e => !e.manager_id && !newIds.has(e.id))
        .map(e => e.id);

      if (rootEmpIds.length > 0) {
        try {
          await Promise.all(rootEmpIds.map(id => odooData.updateEmployee(id, { manager_id: ceoId })));
        } catch (e4: any) { console.error("Move root employees error:", e4); }
      }

      setToast(arabicSource("hierarchy.structure_configured_owner_ceo_coo_edit_data_from_the_edit_butto"));
      setShowSetupModal(false);
      await refetch();
    } catch (err: any) {
      console.error("Setup hierarchy error:", err);
      setToast(`${arabicSource("common.error_2")} ${err?.message || arabicSource("hierarchy.failed_to_initialize_the_organizational_structure")}`);
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
      const sortByCreated = (a: typeof dbEmployees[0], b: typeof dbEmployees[0]) =>
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
    } catch (err: any) {
      console.error("Cleanup error:", err);
      setToast(`${arabicSource("common.error_2")} ${err?.message || arabicSource("hierarchy.chassis_cleaning_failed")}`);
    }
    setSaving(false);
  }, [dbEmployees, refetch]);

  const openAddModal = useCallback((managerId?: number) => {
    setAddModalManagerId(managerId ?? null); setShowAddModal(true);
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panEnabled || !containerRef.current) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: containerRef.current.scrollLeft, scrollTop: containerRef.current.scrollTop };
  }, [panEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
    containerRef.current.scrollTop = dragStartRef.current.scrollTop - (e.clientY - dragStartRef.current.y);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);

  const handleSearchSelect = useCallback((node: OrgNode) => { setFocusedNodeId(node.id); setSearchQuery(node.name); setShowSearchResults(false); }, []);
  const clearSearch = useCallback(() => { setSearchQuery(""); setFocusedNodeId(null); setShowSearchResults(false); }, []);

  const handlePrint = useCallback(() => {
    if (!chartContentRef.current) return;
    const w = window.open("", "_blank"); if (!w) return;
    const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
    const direction = getLanguageDirection(language);
    const title = translateArabicSource(arabicSource("common.organizational_structure"), language);
    const subtitle = translateArabicSource(arabicSource("exports.organization_subtitle"), language);
    const footer = translateArabicSource(arabicSource("exports.created_on"), language);
    const product = translateArabicSource(arabicSource("shared.human_resources_system"), language);
    w.document.write(`<!DOCTYPE html><html dir="${direction}" lang="${language}"><head><meta charset="UTF-8"><title>${title}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}body{background:#fff;padding:40px 20px;direction:${direction}}
      .ph{text-align:center;margin-bottom:30px;border-bottom:2px solid #e5e7eb;padding-bottom:20px}
      .ph h1{font-size:24px;color:#1f2937}.ph p{font-size:14px;color:#6b7280;margin-top:5px}
      .pf{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
      @media print{body{padding:10px}@page{size:landscape;margin:15mm}}</style></head>
      <body><div class="ph"><h1>${title}</h1><p>${subtitle}</p></div>
      <div style="overflow:auto">${chartContentRef.current.innerHTML}</div>
      <div class="pf">${footer} ${formatDate(new Date())} — ${product}</div></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 500);
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!chartContentRef.current) return;
    try {
      const exportLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
      const exportDirection = getLanguageDirection(exportLanguage);
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d"); if (!ctx) return;
      const el = chartContentRef.current; const scale = 2;
      canvas.width = el.scrollWidth * scale; canvas.height = el.scrollHeight * scale;
      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.scrollWidth}" height="${el.scrollHeight}">
        <foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="background:#0F0F0F;color:#FFF8E1;font-family:Tajawal,sans-serif;direction:${exportDirection}">${el.innerHTML}</div></foreignObject></svg>`;
      const img = new Image(); const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
      img.onload = () => { ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        canvas.toBlob(b => { if (!b) return; const a = document.createElement("a"); a.download = `${translateArabicSource(arabicSource("common.organizational_structure")).replace(/\s+/g, "-")}-${formatDate(new Date()).replace(/[\\/:]/g, "-")}.png`; a.href = URL.createObjectURL(b); a.click(); URL.revokeObjectURL(a.href); }); };
      img.onerror = () => { URL.revokeObjectURL(url); handlePrint(); }; img.src = url;
    } catch { handlePrint(); }
  }, [handlePrint]);

  // Live stats from tree
  const departmentStats = useMemo(() => {
    const c: Record<string, number> = {};
    allNodes.filter(n => n.dbId !== "__root__").forEach(n => { c[n.department] = (c[n.department] || 0) + 1; });
    return Object.entries(c).map(([name, count]) => ({ name, count }));
  }, [allNodes]);

  if (dbLoading || positionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("hierarchy.loading_the_organizational_chart")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.organizational_structure")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("hierarchy.organization_structure_and_department_map_data_directly_from_the")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unlinkedEmps.length > 0 && (
            <button onClick={() => setShowUnlinked(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-all shadow-sm" style={{ fontSize: 13 }}>
              <AlertTriangle className="w-4 h-4" />
              {unlinkedEmps.length} {arabicSource("hierarchy.without_binding")}
            </button>
          )}

          <button onClick={() => setShowSetupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-black hover:opacity-90 transition-all shadow-md" style={{ fontSize: 13, background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
            <Crown className="w-4 h-4" /> {arabicSource("common.chassis_initialization")}
          </button>

          <button onClick={() => setShowCleanupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all shadow-sm" style={{ fontSize: 13 }}>
            <Trash2 className="w-4 h-4" /> {arabicSource("common.clean_up_duplicates")}
          </button>

          <button onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md" style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> {arabicSource("common.add_an_employee")}
          </button>

          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input ref={searchInputRef} type="text" placeholder={arabicSource("common.search_for_an_employee")} value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); setFocusedNodeId(null); }}
              onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
              className="bg-card border border-border/60 rounded-lg ps-9 pe-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              style={{ fontSize: 13, width: 220 }} />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute end-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
            <AnimatePresence>
              {showSearchResults && searchQuery.trim() && <SearchResults results={searchResults} onSelect={handleSearchSelect} onClose={() => setShowSearchResults(false)} />}
            </AnimatePresence>
            <AnimatePresence>
              {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-1 start-0 end-0 bg-card border border-border/60 rounded-lg shadow-xl z-50 px-3 py-3 text-center">
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("hierarchy.there_are_no_results_for")}{searchQuery}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all" style={{ fontSize: 13 }} title={arabicSource("common.print")}>
            <Printer className="w-4 h-4" /><span className="hidden sm:inline">{arabicSource("common.print")}</span>
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all" style={{ fontSize: 13 }} title={arabicSource("hierarchy.export_png")}>
            <Download className="w-4 h-4" /><span className="hidden sm:inline">{arabicSource("common.export")}</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
        <button onClick={() => setViewMode("tree")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "tree" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`} style={{ fontSize: 13 }}>
          <GitBranch className="w-4 h-4" /> {arabicSource("hierarchy.current_structure")}
        </button>
        <button onClick={() => setViewMode("positions")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "positions" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`} style={{ fontSize: 13 }}>
          <Network className="w-4 h-4" /> {arabicSource("hierarchy.positions_and_appointments")}
        </button>
      </div>

      {/* Positions View */}
      {viewMode === "positions" ? (
        <PositionsView dbEmployees={dbEmployees} dbDepartments={dbDepartments} deptColors={deptColors} refetch={() => { refetch(); refetchPositions(); }} />
      ) : (
      <>

      {/* How it works — info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Link2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>
            {dbPositions.length > 0
              ? <>{arabicSource("hierarchy.the_organizational_structure_is_automatically_built_from")} <span className="text-primary">{arabicSource("common.position_structure")}</span> {arabicSource("hierarchy.appoint_employees_from_the_positions_and_designations_tab")}</>
              : <>{arabicSource("hierarchy.the_organizational_structure_is_automatically_built_from_a_field")} <span className="text-primary">{arabicSource("hierarchy.direct_manager_manager_id")}</span> {arabicSource("hierarchy.in_each_employee_s_data")}</>
            }
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            {dbPositions.length > 0
              ? arabicSource("hierarchy.vacant_positions_are_shown_with_a_dashed_frame_card_colors_follo")
              : arabicSource("hierarchy.to_assign_a_manager_to_an_employee_edit_the_employee_data_from_t")
            }
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/30 rounded-xl p-3 text-center shadow-md">
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.total_employees")}</p>
          <span className="text-gradient-gold block mt-1" style={{ fontSize: 22 }}>{dbEmployees.length}</span>
          <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("hierarchy.in")} {departmentStats.length} {arabicSource("common.sections")}</p>
        </motion.div>
        {departmentStats.map((dept, i) => (
          <motion.div key={dept.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.05 }}
            className="bg-card border border-border/60 rounded-xl p-3 text-center shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: deptColors[dept.name] || "#888" }} />
              <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{dept.name}</p>
            </div>
            <span className="text-foreground block" style={{ fontSize: 20 }}>{dept.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Org Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-wrap gap-2">
          <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.interactive_organization_map")}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {saving && (
              <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {arabicSource("common.saving")}
              </div>
            )}
            <button onClick={() => setPanEnabled(!panEnabled)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${panEnabled ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              title={panEnabled ? arabicSource("hierarchy.stop_dragging") : arabicSource("hierarchy.activate_drag_to_move")}>
              <Move className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border/40" />
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={arabicSource("hierarchy.zoom_out")}><Minus className="w-4 h-4" /></button>
            <span className="text-muted-foreground min-w-[40px] text-center" style={{ fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={arabicSource("hierarchy.enlarge")}><Plus className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1)} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={arabicSource("hierarchy.reset")}><Maximize2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-border/40" />
            <button onClick={expandAll} className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>{arabicSource("hierarchy.expand_all")}</button>
            <button onClick={collapseAll} className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>{arabicSource("hierarchy.collapse_all")}</button>
          </div>
        </div>

        <AnimatePresence>
          {panEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border-b border-primary/10 px-5 py-2 flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-primary" />
              <p className="text-primary" style={{ fontSize: 12 }}>{arabicSource("hierarchy.drag_mode_is_on_drag_with_the_mouse_to_move_around_the_map")}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={containerRef} className={`overflow-auto p-8 ${panEnabled ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
          style={{ maxHeight: "75vh" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {dbEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p style={{ fontSize: 16 }}>{arabicSource("hierarchy.there_are_no_employees_in_the_system_yet")}</p>
              <p className="mt-2" style={{ fontSize: 13 }}>{arabicSource("hierarchy.add_employees_from_the_employees_page_and_then_select_their_dire")}</p>
            </div>
          ) : (
            <div style={{ width: "fit-content", minWidth: "100%", paddingBottom: 40 }}>
              <div ref={chartContentRef} className="transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "fit-content", margin: "0 auto" }}>
                <OrgCard node={orgTree} expandedMap={expandedMap} toggleExpand={toggleExpand}
                  onSelect={setSelectedNode} selectedId={selectedNode?.id ?? null}
                  highlightedIds={highlightedIds} searchMatchIds={searchMatchIds} deptColors={deptColors} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search count */}
      <AnimatePresence>
        {searchQuery.trim() && searchMatchIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="bg-card border border-primary/40 rounded-full px-4 py-2 shadow-xl flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground" style={{ fontSize: 12 }}>{searchMatchIds.size} {arabicSource("hierarchy.result_for")}{searchQuery}"</span>
              </div>
              <button onClick={clearSearch} className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto ${toast.startsWith(arabicSource("common.error")) ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toast.startsWith(arabicSource("common.error")) ? "bg-red-500/20" : "bg-green-500/20"}`}>
                {toast.startsWith(arabicSource("common.error")) ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <UserCheck className="w-3 h-3 text-green-400" />}
              </div>
              <span className="text-foreground" style={{ fontSize: 12 }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && !deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
            <div onClick={e => e.stopPropagation()}>
              <DetailPanel node={selectedNode} orgTree={orgTree} onClose={() => setSelectedNode(null)}
                onAddChild={(id) => { setSelectedNode(null); openAddModal(id); }}
                onDelete={(n) => { setSelectedNode(null); setDeleteTarget(n); }}
                onEdit={(n) => { setSelectedNode(null); setEditTarget(n); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddEmployeeModal allNodes={allNodes} departments={departments} departmentColors={deptColors}
            preselectedManagerId={addModalManagerId}
            onAdd={handleAddEmployee} onClose={() => { setShowAddModal(false); setAddModalManagerId(null); }}
            onAddDepartment={handleAddDepartment} />
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal node={deleteTarget} orgTree={orgTree} onDelete={handleDeleteEmployee} onClose={() => setDeleteTarget(null)} />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editTarget && (
          <EditEmployeeModal node={editTarget} allNodes={allNodes} departments={departments} departmentColors={deptColors}
            onSave={handleEditEmployee} onClose={() => setEditTarget(null)} />
        )}
      </AnimatePresence>

      {/* Unlinked employees panel */}
      <AnimatePresence>
        {showUnlinked && unlinkedEmps.length > 0 && (
          <UnlinkedPanel
            employees={unlinkedEmps}
            allNodes={allNodes}
            onLink={handleLinkEmployee}
            onClose={() => setShowUnlinked(false)}
          />
        )}
      </AnimatePresence>

      {/* Setup Hierarchy Modal */}
      <AnimatePresence>
        {showSetupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSetupModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.preparing_the_organizational_structure")}</h3>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.create_a_structure_owner_ceo_coo")}</p>
                  </div>
                </div>
                <button onClick={() => setShowSetupModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Visual hierarchy preview */}
                <div className="bg-muted/20 border border-border/40 rounded-xl p-4">
                  <div className="flex flex-col items-center gap-3">
                    {/* Owner */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-yellow-400/60" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))" }}>
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400" style={{ fontSize: 13 }}>{arabicSource("common.owner")}</span>
                    </div>
                    <div className="w-px h-4 bg-border/60" />
                    <div className="flex items-center gap-6">
                      {/* CEO */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-px bg-border/60" />
                        <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                          <span className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("common.chief_executive_officer_ceo")}</span>
                        </div>
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                          {dbEmployees.filter(e => !e.manager_id).length > 0
                            ? `← ${dbEmployees.filter(e => !e.manager_id).length} ${arabicSource("hierarchy.current_employee")}`
                            : arabicSource("common.no_subordinates")}
                        </p>
                      </div>
                      {/* COO */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-px bg-border/60" />
                        <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                          <span className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("common.chief_operating_officer_coo")}</span>
                        </div>
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("common.no_subordinates")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("hierarchy.3_new_employees_will_be_created")}</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground" style={{ fontSize: 11 }}>
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-yellow-400" /> <strong className="text-yellow-400">{arabicSource("common.owner")}</strong> {arabicSource("hierarchy.top_of_the_pyramid_gold")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">{arabicSource("common.chief_executive_officer_ceo")}</strong> {arabicSource("common.under_the_owner")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">{arabicSource("common.chief_operating_officer_coo")}</strong> {arabicSource("common.under_the_owner")}
                    </li>
                  </ul>
                  {dbEmployees.filter(e => !e.manager_id).length > 0 && (
                    <p className="mt-2 text-amber-500" style={{ fontSize: 11 }}>
                      {arabicSource("hierarchy.will_be_transferred")} {dbEmployees.filter(e => !e.manager_id).length} {arabicSource("hierarchy.employee_currently_no_manager_under_ceo_you_can_move_them_later")}
                    </p>
                  )}
                </div>

                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  {arabicSource("hierarchy.you_can_modify_the_names_and_data_later_by_clicking_on_the_card")}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={() => setShowSetupModal(false)} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
                <button onClick={handleSetupHierarchy} disabled={saving}
                  className="px-5 py-2 rounded-lg text-black disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13, background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  {saving ? arabicSource("hierarchy.initializing") : arabicSource("common.chassis_initialization")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cleanup Duplicates Modal */}
      <AnimatePresence>
        {showCleanupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCleanupModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 flex items-center justify-between bg-red-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("common.clean_up_duplicates")}</h3>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.delete_duplicate_entries_owner_ceo_coo")}</p>
                  </div>
                </div>
                <button onClick={() => setShowCleanupModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-2">
                  <p className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("hierarchy.the_system_will")}</p>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {arabicSource("hierarchy.delete_duplicate_entries_for_owner_ceo_and_coo")}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      {arabicSource("hierarchy.keep_the_older_version_of_each_position")}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {arabicSource("hierarchy.automatically_reconnect_all_affected_employees")}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                      {arabicSource("hierarchy.ensure_one_correct_structure_owner_ceo_coo")}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/10 border border-border/30 rounded-xl p-3">
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    {arabicSource("hierarchy.current_iterations")} <span className="text-red-400">{dbEmployees.filter(e => e.department === arabicSource("common.owner") || e.position === arabicSource("common.owner")).length}</span> {arabicSource("hierarchy.malik")} {" "}
                    <span className="text-red-400">{dbEmployees.filter(e => e.position === "CEO" && e.department === arabicSource("common.senior_management")).length}</span> CEO، {" "}
                    <span className="text-red-400">{dbEmployees.filter(e => e.position === "COO" && e.department === arabicSource("common.senior_management")).length}</span> COO
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400" style={{ fontSize: 12 }}>{arabicSource("hierarchy.warning_this_action_cannot_be_undone_duplicate_entries_will_be_p")}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={() => setShowCleanupModal(false)} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
                <button onClick={handleCleanupDuplicates} disabled={saving}
                  className="px-5 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {saving ? arabicSource("hierarchy.cleaning_in_progress") : arabicSource("common.clean_up_duplicates")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
