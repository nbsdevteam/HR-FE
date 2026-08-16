import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useHierarchyData, usePositions } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import i18n, { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { formatDate } from "@/i18n/format";
import { translateArabicSource } from "@/i18n/legacy";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { CLEVEL_COLOR, defaultDeptColorMap, OWNER_COLOR } from "../styles";
import {
  buildOrgTree,
  buildOrgTreeFromPositions,
  findAncestorIds,
  findParentOf,
  flattenTree,
  getUnlinkedEmployees,
} from "../utils/hierarchyTree";

export const useHierarchyPage = () => {
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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    setFocusedNodeId(null);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) setShowSearchResults(true);
  }, [searchQuery]);

  const handleShowUnlinked = useCallback(() => setShowUnlinked(true), []);
  const handleShowSetupModal = useCallback(() => setShowSetupModal(true), []);
  const handleShowCleanupModal = useCallback(() => setShowCleanupModal(true), []);
  const handleCloseSearchResults = useCallback(() => setShowSearchResults(false), []);
  const handleTogglePan = useCallback(() => setPanEnabled(current => !current), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1))), []);
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1))), []);
  const handleResetZoom = useCallback(() => setZoom(1), []);
  const handleSelectNode = useCallback((node: OrgNode) => setSelectedNode(node), []);
  const handleCloseSelectedNode = useCallback(() => setSelectedNode(null), []);
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddModalManagerId(null);
  }, []);
  const handleCloseDeleteModal = useCallback(() => setDeleteTarget(null), []);
  const handleCloseEditModal = useCallback(() => setEditTarget(null), []);
  const handleCloseUnlinkedPanel = useCallback(() => setShowUnlinked(false), []);
  const handleCloseSetupModal = useCallback(() => setShowSetupModal(false), []);
  const handleCloseCleanupModal = useCallback(() => setShowCleanupModal(false), []);

  const handleDetailAddChild = useCallback((id: number) => {
    setSelectedNode(null);
    openAddModal(id);
  }, [openAddModal]);

  const handleDetailDelete = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setDeleteTarget(node);
  }, []);

  const handleDetailEdit = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setEditTarget(node);
  }, []);

  const refetchHierarchyAndPositions = useCallback(() => {
    refetch();
    refetchPositions();
  }, [refetch, refetchPositions]);

  // Live stats from tree
  const departmentStats = useMemo(() => {
    const c: Record<string, number> = {};
    allNodes.filter(n => n.dbId !== "__root__").forEach(n => { c[n.department] = (c[n.department] || 0) + 1; });
    return Object.entries(c).map(([name, count]) => ({ name, count }));
  }, [allNodes]);


  return {
    dbEmployees,
    dbDepartments,
    dbPositions,
    dbLoading,
    positionsLoading,
    orgTree,
    deptColors,
    unlinkedEmps,
    viewMode,
    setViewMode,
    expandedMap,
    selectedNode,
    zoom,
    searchQuery,
    showSearchResults,
    containerRef,
    chartContentRef,
    searchInputRef,
    showAddModal,
    addModalManagerId,
    deleteTarget,
    editTarget,
    showUnlinked,
    saving,
    showSetupModal,
    showCleanupModal,
    toast,
    isDragging,
    panEnabled,
    allNodes,
    departments,
    searchResults,
    searchMatchIds,
    highlightedIds,
    departmentStats,
    toggleExpand,
    expandAll,
    collapseAll,
    handleAddEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
    openAddModal,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSearchSelect,
    clearSearch,
    handlePrint,
    handleExportPNG,
    handleSearchChange,
    handleSearchFocus,
    handleShowUnlinked,
    handleShowSetupModal,
    handleShowCleanupModal,
    handleCloseSearchResults,
    handleTogglePan,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
    handleSelectNode,
    handleCloseSelectedNode,
    handleCloseAddModal,
    handleCloseDeleteModal,
    handleCloseEditModal,
    handleCloseUnlinkedPanel,
    handleCloseSetupModal,
    handleCloseCleanupModal,
    handleDetailAddChild,
    handleDetailDelete,
    handleDetailEdit,
    refetchHierarchyAndPositions,
  };
};
