import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, ChevronDown, Minus, Plus, Maximize2, Search, Printer, Download,
  Move, X, UserPlus, Trash2, Building2, UserCheck, Briefcase, ChevronLeft,
  Loader2, AlertTriangle, Link2, Crown, Edit2, Network, GripVertical, Save, ChevronRight as ChevronRightIcon, GitBranch
} from "lucide-react";
import { useHierarchyData, usePositions, empDisplayName } from "../lib/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import i18n, { getLanguageDirection, normalizeLanguage } from "../i18n";
import { formatDate } from "../i18n/format";
import { translateArabicSource } from "../i18n/legacy";

interface OrgNode {
  id: number;
  dbId: string;
  name: string;
  initials: string;
  position: string;
  department: string;
  color: string;
  photo: string | null;
  email: string | null;
  children: OrgNode[];
  // Position-based tree extensions
  isVacant?: boolean;
  positionId?: string;
  assignedEmployees?: { id: string; name: string; photo: string | null }[];
  headcount?: { current: number; max: number };
}

// Expanded palette — 24 distinct hues so every new department gets a unique color
const avatarColors = [
  "#8B5CF6", "#22C55E", "#3B82F6", "#06B6D4", "#EC4899", "#EF4444",
  "#F59E0B", "#14B8A6", "#F97316", "#6366F1", "#A855F7", "#10B981",
  "#0EA5E9", "#D946EF", "#84CC16", "#F43F5E", "#2DD4BF", "#FB923C",
  "#7C3AED", "#059669", "#E11D48", "#0891B2", "#CA8A04", "#9333EA",
];

// Owner = rich gold, C-Level = royal indigo
const OWNER_COLOR = "#FFD700";
const CLEVEL_COLOR = "#7C3AED";

const defaultDeptColorMap: Record<string, string> = {
  "الإدارة العليا": CLEVEL_COLOR,
  "تقنية المعلومات": "#06B6D4",
  "IT": "#06B6D4",
  "المالية": "#3B82F6",
  "التسويق": "#EC4899",
  "الموارد البشرية": "#F43F5E",
  "العمليات": "#EF4444",
  "المبيعات": "#F59E0B",
  "المالك": OWNER_COLOR,
};

/** Pick a colour from the palette that is NOT already used */
function pickUniqueColor(usedColors: Set<string>): string {
  for (const c of avatarColors) {
    if (!usedColors.has(c)) return c;
  }
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}

// ── Build tree from flat employees using manager_id ──

function buildOrgTree(employees: DbEmployee[], departments: DbDepartment[]): { tree: OrgNode; deptColors: Record<string, string> } {
  const dColors: Record<string, string> = { ...defaultDeptColorMap };
  departments.forEach(d => { if (d.color) dColors[d.name] = d.color; });

  // Assign unique colors per department — never repeat an already-used color
  const usedColors = new Set<string>(Object.values(dColors));
  const allDeptNames = new Set<string>();
  employees.forEach(e => { if (e.department) allDeptNames.add(e.department); });
  allDeptNames.forEach(dName => {
    if (!dColors[dName]) {
      const c = pickUniqueColor(usedColors);
      dColors[dName] = c;
      usedColors.add(c);
    }
  });

  const nodeMap = new Map<string, OrgNode>();
  const childrenMap = new Map<string, string[]>();

  employees.forEach((e) => {
    const name = empDisplayName(e);
    nodeMap.set(e.id, {
      id: e.person_id,
      dbId: e.id,
      name,
      initials: name.charAt(0),
      position: e.position || e.department || "—",
      department: e.department || "غير محدد",
      color: dColors[e.department] || avatarColors[0],
      photo: e.profile_picture || null,
      email: e.email || null,
      children: [],
    });
    if (e.manager_id) {
      if (!childrenMap.has(e.manager_id)) childrenMap.set(e.manager_id, []);
      childrenMap.get(e.manager_id)!.push(e.id);
    }
  });

  function attachChildren(node: OrgNode) {
    const childIds = childrenMap.get(node.dbId) || [];
    node.children = childIds.map(id => nodeMap.get(id)).filter(Boolean) as OrgNode[];
    node.children.forEach(attachChildren);
  }

  // Roots = employees without manager_id or whose manager doesn't exist
  const roots: OrgNode[] = [];
  employees.forEach(e => {
    if (!e.manager_id || !nodeMap.has(e.manager_id)) {
      const node = nodeMap.get(e.id);
      if (node) roots.push(node);
    }
  });
  roots.forEach(attachChildren);

  let tree: OrgNode;
  if (roots.length === 1) {
    tree = roots[0];
  } else {
    tree = {
      id: 0, dbId: "__root__", name: "المؤسسة", initials: "م",
      position: "الإدارة العليا", department: "الإدارة العليا",
      color: "#8B5CF6", photo: null, email: null,
      children: roots,
    };
  }
  return { tree, deptColors: dColors };
}

// ── Build tree from positions (single source of truth) ──

function buildOrgTreeFromPositions(
  positions: DbPosition[],
  employees: DbEmployee[],
  departments: DbDepartment[]
): { tree: OrgNode; deptColors: Record<string, string> } {
  // Build department color map
  const dColors: Record<string, string> = { ...defaultDeptColorMap };
  departments.forEach(d => { if (d.color) dColors[d.name] = d.color; });
  const deptById: Record<string, DbDepartment> = {};
  departments.forEach(d => { deptById[d.id] = d; });

  // Assign unique colors to any department not yet colored
  const usedColors = new Set<string>(Object.values(dColors));
  departments.forEach(d => {
    if (!dColors[d.name]) {
      const c = pickUniqueColor(usedColors);
      dColors[d.name] = c;
      usedColors.add(c);
    }
  });

  // Map employees by position_id
  const empsByPos: Record<string, DbEmployee[]> = {};
  employees.forEach(e => {
    if (e.position_id) {
      if (!empsByPos[e.position_id]) empsByPos[e.position_id] = [];
      empsByPos[e.position_id].push(e);
    }
  });

  // Create OrgNode for each position
  let nodeCounter = 1;
  const posNodeMap = new Map<string, OrgNode>();

  positions.filter(p => p.is_active).forEach(pos => {
    const dept = pos.department_id ? deptById[pos.department_id] : null;
    const deptName = dept?.name || "الإدارة العليا";
    const assignedEmps = empsByPos[pos.id] || [];
    const primaryEmp = assignedEmps[0];
    const isVacant = assignedEmps.length === 0;

    // C-level / level-0 positions get golden color
    const isTopLevel = pos.level === 0;
    const color = isTopLevel ? OWNER_COLOR : (dColors[deptName] || avatarColors[0]);

    const name = isVacant ? "شاغر" : empDisplayName(primaryEmp);

    posNodeMap.set(pos.id, {
      id: nodeCounter++,
      dbId: isVacant ? `pos_${pos.id}` : primaryEmp.id,
      name,
      initials: name.charAt(0),
      position: pos.title_ar,
      department: deptName,
      color,
      photo: isVacant ? null : (primaryEmp.profile_picture || null),
      email: isVacant ? null : (primaryEmp.email || null),
      children: [],
      isVacant,
      positionId: pos.id,
      assignedEmployees: assignedEmps.map(e => ({
        id: e.id,
        name: empDisplayName(e),
        photo: e.profile_picture || null,
      })),
      headcount: { current: assignedEmps.length, max: pos.max_headcount },
    });
  });

  // Build tree from reports_to_position_id
  const roots: OrgNode[] = [];
  positions.filter(p => p.is_active).forEach(pos => {
    const node = posNodeMap.get(pos.id);
    if (!node) return;
    if (pos.reports_to_position_id && posNodeMap.has(pos.reports_to_position_id)) {
      posNodeMap.get(pos.reports_to_position_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  let tree: OrgNode;
  if (roots.length === 1) {
    tree = roots[0];
  } else if (roots.length === 0) {
    tree = {
      id: 0, dbId: "__root__", name: "المؤسسة", initials: "م",
      position: "الإدارة العليا", department: "الإدارة العليا",
      color: OWNER_COLOR, photo: null, email: null, children: [],
    };
  } else {
    tree = {
      id: 0, dbId: "__root__", name: "المؤسسة", initials: "م",
      position: "الإدارة العليا", department: "الإدارة العليا",
      color: OWNER_COLOR, photo: null, email: null, children: roots,
    };
  }
  return { tree, deptColors: dColors };
}

// ── Unlinked employees (those whose manager_id points to nonexistent employee) ──
function getUnlinkedEmployees(employees: DbEmployee[]): DbEmployee[] {
  const idSet = new Set(employees.map(e => e.id));
  return employees.filter(e => e.manager_id && !idSet.has(e.manager_id));
}

// ── Tree utilities ──

function countDescendants(node: OrgNode): number {
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
}

function flattenTree(node: OrgNode): OrgNode[] {
  const result: OrgNode[] = [node];
  for (const child of node.children) result.push(...flattenTree(child));
  return result;
}

function findAncestorIds(root: OrgNode, targetId: number): number[] {
  const path: number[] = [];
  function walk(node: OrgNode): boolean {
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (walk(child)) { path.push(node.id); return true; }
    }
    return false;
  }
  walk(root);
  return path;
}

function findParentOf(root: OrgNode, targetId: number): OrgNode | null {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentOf(child, targetId);
    if (found) return found;
  }
  return null;
}

function getDescendantIds(node: OrgNode): Set<number> {
  const ids = new Set<number>();
  function walk(n: OrgNode) { n.children.forEach(c => { ids.add(c.id); walk(c); }); }
  walk(node);
  return ids;
}

// ── SVG Connectors ──

function TreeConnectors({ parentRef, childRefs, color }: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  childRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  color: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const parent = parentRef.current;
    if (!container || !parent) return;
    const cRect = container.getBoundingClientRect();
    const pRect = parent.getBoundingClientRect();
    const px = pRect.left + pRect.width / 2 - cRect.left;
    const py = pRect.bottom - cRect.top;
    const radius = 8, stemLen = 20;
    const jY = py + stemLen;
    const newPaths: string[] = [];

    childRefs.current.forEach((el) => {
      if (!el) return;
      const cr = el.getBoundingClientRect();
      const cx = cr.left + cr.width / 2 - cRect.left;
      const cy = cr.top - cRect.top;
      const dx = cx - px;
      if (Math.abs(dx) < 2) {
        newPaths.push(`M ${px} ${py} L ${px} ${cy}`);
      } else {
        const dir = dx > 0 ? 1 : -1;
        const r = Math.min(radius, Math.abs(dx), stemLen, cy - jY);
        newPaths.push(`M ${px} ${py} L ${px} ${jY - r} Q ${px} ${jY} ${px + dir * r} ${jY} L ${cx - dir * r} ${jY} Q ${cx} ${jY} ${cx} ${jY + r} L ${cx} ${cy}`);
      }
    });
    setPaths(newPaths);
  }, [parentRef, childRefs]);

  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    const c = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (c) { ro = new ResizeObserver(() => requestAnimationFrame(measure)); ro.observe(c); }
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [measure]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.35} />
            <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.06} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Org Card ──

function OrgCard({
  node, depth = 0, expandedMap, toggleExpand, onSelect, selectedId, highlightedIds, searchMatchIds, deptColors,
}: {
  node: OrgNode; depth?: number; expandedMap: Record<number, boolean>; toggleExpand: (id: number) => void;
  onSelect: (node: OrgNode) => void; selectedId: number | null; highlightedIds: Set<number>; searchMatchIds: Set<number>;
  deptColors: Record<string, string>;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedMap[node.id] ?? depth < 2;
  const topColor = deptColors[node.department] || node.color;
  const isSelected = selectedId === node.id;
  const isSearchMatch = searchMatchIds.has(node.id);
  const isHighlighted = highlightedIds.has(node.id);
  const totalChildren = countDescendants(node);
  const isDimmed = searchMatchIds.size > 0 && !isSearchMatch && !isHighlighted;
  const isOwner = node.department === "المالك";
  const isCLevel = node.department === "الإدارة العليا";
  const isVacant = node.isVacant === true;
  const hc = node.headcount;
  const extraEmps = node.assignedEmployees && node.assignedEmployees.length > 1 ? node.assignedEmployees.slice(1) : [];

  const cardRef = useRef<HTMLDivElement>(null);
  const childRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => { childRefs.current = childRefs.current.slice(0, node.children.length); }, [node.children.length]);

  return (
    <div className="relative flex flex-col items-center">
      {hasChildren && isExpanded && <TreeConnectors parentRef={cardRef} childRefs={childRefs} color={topColor} />}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: depth * 0.06, type: "spring", stiffness: 400, damping: 35 }}
        className="relative" style={{ zIndex: 1 }} data-node-id={node.id} ref={cardRef}
      >
        <div
          className={`bg-card border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
            ${isVacant ? "border-dashed border-2 border-border/50 opacity-70" : ""}
            ${isOwner && !isVacant ? "ring-2 ring-yellow-400/50 shadow-yellow-500/20 shadow-lg border-yellow-500/60" : ""}
            ${isCLevel && !isOwner && !isVacant ? "ring-1 ring-purple-400/40 border-purple-400/50" : ""}
            ${isSelected && !isOwner && !isVacant ? "border-primary shadow-primary/20 ring-1 ring-primary/30" : ""}
            ${!isSelected && !isOwner && !isCLevel && !isVacant ? "border-border/60 hover:border-primary/30" : ""}
            ${isSearchMatch ? "ring-2 ring-primary shadow-lg shadow-primary/25 scale-105" : ""}
            ${isDimmed ? "opacity-30" : "opacity-100"}`}
          style={{ minWidth: depth === 0 ? 220 : 195 }}
          onClick={() => !isVacant && onSelect(node)}
        >
          {isOwner && !isVacant ? (
            <div className="h-2" style={{ background: "linear-gradient(90deg, #FFD700, #FFA500, #FFD700)" }} />
          ) : isCLevel && !isVacant ? (
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${CLEVEL_COLOR}, #A78BFA, ${CLEVEL_COLOR})` }} />
          ) : (
            <div className="h-1.5" style={{ background: isVacant ? "transparent" : topColor }} />
          )}
          <div className="p-3 pt-2.5">
            <div className="flex items-center gap-2.5">
              {isVacant ? (
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-muted-foreground/40" />
                </div>
              ) : node.photo ? (
                <img src={node.photo} alt={node.name} className={`w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-sm ${isOwner ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-card" : ""} ${isSearchMatch ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""}`} />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isSearchMatch ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""}`}
                  style={{ background: isOwner ? "linear-gradient(135deg, #FFD700, #FFA500)" : isCLevel ? `linear-gradient(135deg, ${CLEVEL_COLOR}, #A78BFA)` : node.color }}>
                  {isOwner ? (
                    <Crown className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white" style={{ fontSize: 14 }}>{node.initials}</span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate ${isVacant ? "text-muted-foreground/50 italic" : isOwner ? "text-yellow-500" : "text-foreground"}`} style={{ fontSize: 13 }}>
                  {isVacant ? "شاغر" : node.name}
                </p>
                <p className={`truncate ${isCLevel ? "text-purple-400" : "text-muted-foreground"}`} style={{ fontSize: 11 }}>{node.position}</p>
              </div>
            </div>

            {/* Extra employees (headcount > 1) */}
            {extraEmps.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                {extraEmps.map(emp => (
                  <div key={emp.id} className="flex items-center gap-1.5">
                    {emp.photo ? (
                      <img src={emp.photo} alt={emp.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: topColor }}>
                        <span className="text-white" style={{ fontSize: 8 }}>{emp.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{emp.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{node.department}</span>
                {hc && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                    hc.current >= hc.max ? "bg-emerald-500/15 text-emerald-400" :
                    hc.current > 0 ? "bg-amber-500/15 text-amber-400" :
                    "bg-muted/30 text-muted-foreground"
                  }`}>{hc.current}/{hc.max}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalChildren > 0 && (
                  <div className="flex items-center gap-0.5 text-muted-foreground" style={{ fontSize: 10 }}>
                    <Users className="w-3 h-3" /><span>{totalChildren}</span>
                  </div>
                )}
                {hasChildren && (
                  <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                    <ChevronDown className="w-3 h-3 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {hasChildren && isExpanded && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
            className="flex gap-4 pt-10" style={{ zIndex: 1 }}>
            {node.children.map((child, i) => (
              <div key={child.dbId} ref={(el) => { childRefs.current[i] = el; }}>
                <OrgCard node={child} depth={depth + 1} expandedMap={expandedMap} toggleExpand={toggleExpand}
                  onSelect={onSelect} selectedId={selectedId} highlightedIds={highlightedIds} searchMatchIds={searchMatchIds} deptColors={deptColors} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Add Employee Modal ──

function AddEmployeeModal({
  allNodes, departments, departmentColors, preselectedManagerId, onAdd, onClose, onAddDepartment,
}: {
  allNodes: OrgNode[]; departments: string[]; departmentColors: Record<string, string>;
  preselectedManagerId: number | null;
  onAdd: (parentDbId: string, name: string, position: string, department: string) => void;
  onClose: () => void;
  onAddDepartment: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState(departments[0] || "");
  const [managerId, setManagerId] = useState<number>(preselectedManagerId ?? allNodes[0]?.id ?? 0);
  const [showNewDept, setShowNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState(() => pickUniqueColor(new Set(Object.values(departmentColors))));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const selectedManager = allNodes.find(n => n.id === managerId);

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!position.trim()) e.position = true;
    if (showNewDept && !newDeptName.trim()) e.newDept = true;
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    let finalDept = department;
    if (showNewDept && newDeptName.trim()) {
      finalDept = newDeptName.trim();
      onAddDepartment(finalDept, newDeptColor);
    }
    const parentNode = allNodes.find(n => n.id === managerId);
    const parentDbId = parentNode?.dbId || "__root__";
    onAdd(parentDbId, name.trim(), position.trim(), finalDept);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>إضافة موظف جديد</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>سيتم إضافته للهيكل التنظيمي وقاعدة البيانات</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-primary" /> اسم الموظف</span>
            </label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder="مثال: أحمد علي"
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.name ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.name && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>يرجى إدخال اسم الموظف</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary" /> المسمى الوظيفي</span>
            </label>
            <input type="text" value={position} onChange={e => { setPosition(e.target.value); setErrors(p => ({ ...p, position: false })); }}
              placeholder="مثال: مطور برمجيات"
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.position ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.position && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>يرجى إدخال المسمى الوظيفي</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" /> القسم</span>
            </label>
            {!showNewDept ? (
              <div className="space-y-2">
                <select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  style={{ fontSize: 13 }}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewDept(true)}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors" style={{ fontSize: 12 }}>
                  <Plus className="w-3.5 h-3.5" /> إضافة قسم جديد
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={newDeptName} onChange={e => { setNewDeptName(e.target.value); setErrors(p => ({ ...p, newDept: false })); }}
                    placeholder="اسم القسم الجديد" autoFocus
                    className={`flex-1 bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.newDept ? "border-red-500" : "border-border/60"}`}
                    style={{ fontSize: 13 }} />
                  <div className="flex items-center gap-1 flex-wrap" style={{ maxWidth: 140 }}>
                    {avatarColors.filter(c => !Object.values(departmentColors).includes(c)).slice(0, 8).map(c => (
                      <button key={c} type="button" onClick={() => setNewDeptColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${newDeptColor === c ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {errors.newDept && <p className="text-red-400" style={{ fontSize: 11 }}>يرجى إدخال اسم القسم</p>}
                <button type="button" onClick={() => { setShowNewDept(false); setNewDeptName(""); }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>
                  <ChevronLeft className="w-3 h-3" /> العودة للأقسام الحالية
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> المسؤول المباشر (المدير)</span>
            </label>
            <select value={managerId} onChange={e => setManagerId(Number(e.target.value))}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              style={{ fontSize: 13 }}>
              {allNodes.filter(n => n.dbId !== "__root__").map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </select>
            {selectedManager && selectedManager.dbId !== "__root__" && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                {selectedManager.photo ? (
                  <img src={selectedManager.photo} alt={selectedManager.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: selectedManager.color }}>
                    <span className="text-white" style={{ fontSize: 10 }}>{selectedManager.initials}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>سيكون تابعاً لـ: {selectedManager.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{selectedManager.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> إضافة للهيكل
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Confirmation ──

function DeleteConfirmModal({ node, orgTree, onDelete, onClose }: {
  node: OrgNode; orgTree: OrgNode; onDelete: (node: OrgNode, reparent: boolean) => void; onClose: () => void;
}) {
  const parentNode = findParentOf(orgTree, node.id);
  const hasChildren = node.children.length > 0;
  const topColor = defaultDeptColorMap[node.department] || node.color;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: topColor }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {node.photo ? (
              <img src={node.photo} alt={node.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ background: node.color }}>
                <span className="text-white" style={{ fontSize: 18 }}>{node.initials}</span>
              </div>
            )}
            <div>
              <h3 className="text-foreground" style={{ fontSize: 14 }}>{node.name}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{node.position}</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-red-400" style={{ fontSize: 12 }}>هل أنت متأكد من حذف هذا الموظف من الهيكل التنظيمي؟</p>
            <p className="text-red-400/70 mt-1" style={{ fontSize: 11 }}>سيتم إزالة الربط بالمدير فقط — لن يُحذف الموظف من النظام.</p>
          </div>

          {hasChildren ? (
            <div className="space-y-3">
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>هذا الموظف لديه {node.children.length} مرؤوسين مباشرين. اختر ما يجب فعله:</p>
              <button onClick={() => onDelete(node, true)}
                className="w-full text-start p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-foreground" style={{ fontSize: 13 }}>نقل المرؤوسين للأعلى</span>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  {parentNode ? `سيتم نقل المرؤوسين إلى "${parentNode.name}"` : "سيتم نقل المرؤوسين لمستوى أعلى"}
                </p>
              </button>
              <button onClick={() => onDelete(node, false)}
                className="w-full text-start p-3 rounded-xl border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span className="text-red-400" style={{ fontSize: 13 }}>فصل كل المرؤوسين</span>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>سيفقد {countDescendants(node)} موظف الربط بمديرهم</p>
              </button>
              <button onClick={onClose} className="w-full mt-1 py-2 rounded-lg bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-center" style={{ fontSize: 12 }}>إلغاء</button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 mt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
              <button onClick={() => onDelete(node, false)} className="px-5 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
                <Trash2 className="w-4 h-4" /> فصل من الهيكل
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit Employee Modal ──

function EditEmployeeModal({ node, allNodes, departments, departmentColors, onSave, onClose }: {
  node: OrgNode;
  allNodes: OrgNode[];
  departments: string[];
  departmentColors: Record<string, string>;
  onSave: (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(node.name);
  const [position, setPosition] = useState(node.position);
  const [department, setDepartment] = useState(node.department);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Find current manager id
  useEffect(() => {
    const findManagerId = (searchNode: OrgNode, targetId: number): number | null | undefined => {
      for (const child of searchNode.children) {
        if (child.id === targetId) return searchNode.dbId === "__root__" ? null : searchNode.id;
        const result = findManagerId(child, targetId);
        if (result !== undefined) return result;
      }
      return undefined;
    };
    // Create a virtual root for searching
    const virtualRoot: OrgNode = {
      id: 0, dbId: "__root__", name: "root", initials: "R", position: "", department: "",
      color: "", photo: null, email: null,
      children: allNodes.filter(n => !allNodes.some(parent => parent.children.some(c => c.id === n.id))),
    };
    const currentManagerId = findManagerId(virtualRoot, node.id);
    setManagerId(currentManagerId ?? null);
  }, [node.id, allNodes]);

  const topColor = departmentColors[department] || node.color;
  const descendantIds = getDescendantIds(node);
  const validManagers = allNodes.filter(
    n => n.id !== node.id && !descendantIds.has(n.id) && n.dbId !== "__root__"
  );

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!position.trim()) e.position = true;
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const updates: { name?: string; position?: string; department?: string; manager_id?: string | null } = {};
    if (name !== node.name) updates.name = name.trim();
    if (position !== node.position) updates.position = position.trim();
    if (department !== node.department) updates.department = department;
    if (managerId !== null) {
      const selectedManager = allNodes.find(n => n.id === managerId);
      if (selectedManager) updates.manager_id = selectedManager.dbId;
    } else {
      updates.manager_id = null;
    }

    onSave(node.dbId, updates);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="bg-blue-500/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>تعديل بيانات الموظف</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>قم بتحديث معلومات الموظف</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-blue-400" /> اسم الموظف</span>
            </label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder="اسم الموظف"
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 transition-colors ${errors.name ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.name && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>يرجى إدخال اسم الموظف</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-400" /> المسمى الوظيفي</span>
            </label>
            <input type="text" value={position} onChange={e => { setPosition(e.target.value); setErrors(p => ({ ...p, position: false })); }}
              placeholder="المسمى الوظيفي"
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 transition-colors ${errors.position ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.position && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>يرجى إدخال المسمى الوظيفي</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" /> القسم</span>
            </label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> المسؤول المباشر (اختياري)</span>
            </label>
            <select value={managerId ?? ""} onChange={e => setManagerId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              <option value="">بدون مدير (أعلى الهرم)</option>
              {validManagers.map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </select>
            {managerId !== null && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                {allNodes.find(n => n.id === managerId)?.photo ? (
                  <img src={allNodes.find(n => n.id === managerId)?.photo!} alt="manager" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: allNodes.find(n => n.id === managerId)?.color }}>
                    <span className="text-white" style={{ fontSize: 10 }}>{allNodes.find(n => n.id === managerId)?.initials}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>المدير: {allNodes.find(n => n.id === managerId)?.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{allNodes.find(n => n.id === managerId)?.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-500/90 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
            <Edit2 className="w-4 h-4" /> حفظ التغييرات
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Detail Panel ──

function DetailPanel({ node, orgTree, onClose, onAddChild, onDelete, onEdit }: {
  node: OrgNode; orgTree: OrgNode; onClose: () => void;
  onAddChild: (parentId: number) => void; onDelete: (node: OrgNode) => void;
  onEdit: (node: OrgNode) => void;
}) {
  const topColor = defaultDeptColorMap[node.department] || node.color;
  const parentNode = findParentOf(orgTree, node.id);
  const isRoot = node.id === orgTree.id;
  const isVirtualRoot = node.dbId === "__root__";

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden" style={{ minWidth: 300, maxWidth: 340 }}>
      <div className="h-1.5" style={{ background: topColor }} />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {!isVirtualRoot && (
              <button onClick={() => onAddChild(node.id)} className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors" title="إضافة مرؤوس">
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {!isRoot && !isVirtualRoot && (
              <button onClick={() => onEdit(node)} className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="تعديل البيانات">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isRoot && !isVirtualRoot && (
              <button onClick={() => onDelete(node)} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="فصل من الهيكل">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          {node.photo ? (
            <img src={node.photo} alt={node.name} className="w-16 h-16 rounded-full object-cover shadow-lg mb-3" style={{ border: `3px solid ${topColor}` }} />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-3" style={{ background: node.color }}>
              <span className="text-white" style={{ fontSize: 24 }}>{node.initials}</span>
            </div>
          )}
          <h3 className="text-foreground">{node.name}</h3>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{node.position}</p>
          <span className="mt-2 px-3 py-1 rounded-full text-white" style={{ fontSize: 11, background: topColor }}>{node.department}</span>
        </div>

        {!isVirtualRoot && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>رقم الموظف</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>EMP-{String(node.id).padStart(4, "0")}</span>
            </div>
            {parentNode && parentNode.dbId !== "__root__" && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>المدير المباشر</span>
                <div className="flex items-center gap-1.5">
                  {parentNode.photo ? (
                    <img src={parentNode.photo} alt={parentNode.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: parentNode.color }}>
                      <span className="text-white" style={{ fontSize: 8 }}>{parentNode.initials}</span>
                    </div>
                  )}
                  <span className="text-foreground" style={{ fontSize: 12 }}>{parentNode.name}</span>
                </div>
              </div>
            )}
            {!parentNode && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>المدير المباشر</span>
                <span className="text-primary" style={{ fontSize: 12 }}>بدون مدير (أعلى الهرم)</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>المرؤوسين المباشرين</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>{node.children.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>إجمالي الفريق</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>{countDescendants(node)}</span>
            </div>
            {node.email && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>البريد</span>
                <span className="text-foreground" style={{ fontSize: 12, direction: "ltr" }}>{node.email}</span>
              </div>
            )}
          </div>
        )}

        {node.children.length > 0 && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>المرؤوسين المباشرين</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {node.children.map(child => (
                <div key={child.dbId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  {child.photo ? (
                    <img src={child.photo} alt={child.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: child.color }}>
                      <span className="text-white" style={{ fontSize: 10 }}>{child.initials}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground truncate" style={{ fontSize: 11 }}>{child.name}</p>
                    <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{child.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isVirtualRoot && (
          <button onClick={() => onAddChild(node.id)}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary flex items-center justify-center gap-2 transition-all" style={{ fontSize: 12 }}>
            <UserPlus className="w-4 h-4" /> إضافة مرؤوس جديد
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Search Results ──

function SearchResults({ results, onSelect, onClose }: {
  results: OrgNode[]; onSelect: (node: OrgNode) => void; onClose: () => void;
}) {
  if (results.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
      className="absolute top-full mt-1 start-0 end-0 bg-card border border-border/60 rounded-lg shadow-xl z-50 overflow-hidden max-h-[260px] overflow-y-auto">
      {results.map((node) => (
        <button key={node.dbId} onClick={() => { onSelect(node); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors text-start border-b border-border/20 last:border-b-0">
          {node.photo ? (
            <img src={node.photo} alt={node.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: node.color }}>
              <span className="text-white" style={{ fontSize: 11 }}>{node.initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate" style={{ fontSize: 12 }}>{node.name}</p>
            <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{node.position} — {node.department}</p>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

// ── Unlinked Employees Panel ──

function UnlinkedPanel({ employees, allNodes, onLink, onClose }: {
  employees: DbEmployee[];
  allNodes: OrgNode[];
  onLink: (empDbId: string, managerDbId: string) => void;
  onClose: () => void;
}) {
  const [selectedManager, setSelectedManager] = useState<Record<string, string>>({});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="bg-amber-500/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>موظفون بدون ربط</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>هؤلاء الموظفون ليس لديهم مدير محدد — حدد المدير المباشر لكل منهم</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {employees.map(emp => {
            const name = empDisplayName(emp);
            return (
              <div key={emp.id} className="p-3 rounded-xl border border-border/40 bg-muted/5 space-y-2">
                <div className="flex items-center gap-2.5">
                  {emp.profile_picture ? (
                    <img src={emp.profile_picture} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-500" style={{ fontSize: 13 }}>{name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-foreground" style={{ fontSize: 13 }}>{name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{emp.position || emp.department || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedManager[emp.id] || ""}
                    onChange={e => setSelectedManager(p => ({ ...p, [emp.id]: e.target.value }))}
                    className="flex-1 bg-background border border-border/60 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 12 }}
                  >
                    <option value="">اختر المدير المباشر...</option>
                    {allNodes.filter(n => n.dbId !== "__root__" && n.dbId !== emp.id).map(n => (
                      <option key={n.dbId} value={n.dbId}>{n.name} — {n.position}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedManager[emp.id]) onLink(emp.id, selectedManager[emp.id]);
                    }}
                    disabled={!selectedManager[emp.id]}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1"
                    style={{ fontSize: 12 }}
                  >
                    <Link2 className="w-3.5 h-3.5" /> ربط
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Positions & Drag-and-Drop Assignment View ──
// ══════════════════════════════════════════════════════════════

interface PositionNode extends DbPosition {
  children: PositionNode[];
  assignedEmployees: DbEmployee[];
}

function buildPositionTree(positions: DbPosition[], employees: DbEmployee[]): PositionNode[] {
  const nodeMap = new Map<string, PositionNode>();
  positions.forEach(p => nodeMap.set(p.id, { ...p, children: [], assignedEmployees: [] }));
  // Assign employees to positions
  employees.forEach(e => {
    if (e.position_id) {
      const node = nodeMap.get(e.position_id);
      if (node) node.assignedEmployees.push(e);
    }
  });
  // Build tree
  const roots: PositionNode[] = [];
  nodeMap.forEach(node => {
    if (node.reports_to_position_id) {
      const parent = nodeMap.get(node.reports_to_position_id);
      if (parent) { parent.children.push(node); return; }
    }
    roots.push(node);
  });
  return roots;
}

function PositionCard({
  node, depth, departments, employees, deptColors, onDrop, onAddPosition, onDeletePosition, onEditPosition, expandedPositions, togglePositionExpand,
}: {
  node: PositionNode; depth: number; departments: DbDepartment[];
  employees: DbEmployee[]; deptColors: Record<string, string>;
  onDrop: (employeeId: string, positionId: string) => void;
  onAddPosition: (parentId: string | null) => void;
  onDeletePosition: (posId: string) => void;
  onEditPosition: (pos: PositionNode) => void;
  expandedPositions: Record<string, boolean>;
  togglePositionExpand: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const dept = departments.find(d => d.id === node.department_id);
  const deptColor = dept ? (deptColors[dept.name] || dept.color || "#8B5CF6") : "#8B5CF6";
  const vacancies = node.max_headcount - node.assignedEmployees.length;
  const isExpanded = expandedPositions[node.id] ?? depth < 3;
  const hasChildren = node.children.length > 0;

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const empId = e.dataTransfer.getData("employee-id");
    if (empId) onDrop(empId, node.id);
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: depth * 0.05 }}
        className={`rounded-xl border-2 shadow-md transition-all ${
          dragOver
            ? "border-primary bg-primary/10 shadow-primary/30 shadow-lg scale-[1.02]"
            : vacancies > 0
              ? "border-dashed border-primary/30 bg-card/50 hover:border-primary/50"
              : "border-border/60 bg-card/30 hover:border-border"
        }`}
        style={{ minWidth: 220 }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        <div className="h-1.5 rounded-t-lg" style={{ background: deptColor }} />
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${deptColor}20` }}>
                <Briefcase className="w-4 h-4" style={{ color: deptColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: 13 }}>{node.title_ar}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{dept?.name || "بدون قسم"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEditPosition(node)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-blue-500/20 transition-colors" title="تعديل">
                <Edit2 className="w-3 h-3 text-blue-400" />
              </button>
              <button onClick={() => onAddPosition(node.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/20 transition-colors" title="إضافة منصب فرعي">
                <Plus className="w-3 h-3 text-primary" />
              </button>
              {node.assignedEmployees.length === 0 && node.children.length === 0 && (
                <button onClick={() => onDeletePosition(node.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors" title="حذف">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          </div>

          {/* Assigned employees */}
          {node.assignedEmployees.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {node.assignedEmployees.map(emp => (
                <div key={emp.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {emp.profile_picture ? (
                    <img src={emp.profile_picture} alt={empDisplayName(emp)} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: deptColor }}>
                      <span className="text-white" style={{ fontSize: 9 }}>{empDisplayName(emp).charAt(0)}</span>
                    </div>
                  )}
                  <span className="text-foreground truncate" style={{ fontSize: 11 }}>{empDisplayName(emp)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vacancy indicator */}
          {vacancies > 0 && (
            <div className={`p-2 rounded-lg border-2 border-dashed text-center transition-colors ${
              dragOver ? "border-primary/60 bg-primary/5" : "border-border/30"
            }`}>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                {dragOver ? "أفلت هنا للتعيين" : `${vacancies} شاغر`}
              </p>
            </div>
          )}

          {/* Headcount badge */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground" style={{ fontSize: 10 }}>
              {node.assignedEmployees.length}/{node.max_headcount}
            </span>
            {hasChildren && (
              <button onClick={() => togglePositionExpand(node.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex gap-4 pt-8">
          {node.children.map(child => (
            <PositionCard key={child.id} node={child} depth={depth + 1} departments={departments}
              employees={employees} deptColors={deptColors} onDrop={onDrop}
              onAddPosition={onAddPosition} onDeletePosition={onDeletePosition} onEditPosition={onEditPosition}
              expandedPositions={expandedPositions} togglePositionExpand={togglePositionExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableEmployeeCard({ emp, deptColors }: { emp: DbEmployee; deptColors: Record<string, string> }) {
  const [dragging, setDragging] = useState(false);
  const name = empDisplayName(emp);
  const color = deptColors[emp.department] || "#8B5CF6";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("employee-id", emp.id); e.dataTransfer.effectAllowed = "move"; setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      {emp.profile_picture ? (
        <img src={emp.profile_picture} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
          <span className="text-white" style={{ fontSize: 10 }}>{name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate" style={{ fontSize: 12 }}>{name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{emp.department || "—"}</p>
      </div>
    </div>
  );
}

function PositionsView({ dbEmployees, dbDepartments, deptColors, refetch }: {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  deptColors: Record<string, string>;
  refetch: () => void;
}) {
  const { positions, loading: posLoading, refetch: refetchPositions } = usePositions();
  const [empSearch, setEmpSearch] = useState("");
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for add/edit position
  const [posForm, setPosForm] = useState({
    title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "",
  });

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const positionTree = useMemo(() => buildPositionTree(positions, dbEmployees), [positions, dbEmployees]);

  // Unassigned employees (no position_id)
  const unassignedEmployees = useMemo(() => {
    const assigned = new Set(dbEmployees.filter(e => e.position_id).map(e => e.id));
    return dbEmployees.filter(e => !assigned.has(e.id));
  }, [dbEmployees]);

  const filteredUnassigned = useMemo(() => {
    if (!empSearch.trim()) return unassignedEmployees;
    const q = empSearch.trim().toLowerCase();
    return unassignedEmployees.filter(e => empDisplayName(e).includes(q) || (e.department || "").includes(q));
  }, [unassignedEmployees, empSearch]);

  const togglePositionExpand = useCallback((id: string) => {
    setExpandedPositions(p => ({ ...p, [id]: !(p[id] ?? true) }));
  }, []);

  // Drop handler — assign employee to position
  const handleDrop = useCallback(async (employeeId: string, positionId: string) => {
    setSaving(true);
    const pos = positions.find(p => p.id === positionId);
    if (!pos) { setSaving(false); return; }

    // Check headcount
    const currentCount = dbEmployees.filter(e => e.position_id === positionId).length;
    if (currentCount >= pos.max_headcount) {
      setToast("خطأ: المنصب ممتلئ — لا يمكن تعيين المزيد");
      setSaving(false);
      return;
    }

    // Auto-resolve department and manager
    const dept = dbDepartments.find(d => d.id === pos.department_id);

    // Find manager: look for someone holding the parent position
    let managerId: string | null = null;
    if (pos.reports_to_position_id) {
      const parentHolder = dbEmployees.find(e => e.position_id === pos.reports_to_position_id);
      if (parentHolder) managerId = parentHolder.id;
    }

    const updates: Record<string, any> = { position_id: positionId };
    if (dept) updates.department = dept.name;
    if (managerId) updates.manager_id = managerId;
    if (pos.title_ar) updates.position = pos.title_ar;

    const { error } = await supabase.from("employees").update(updates).eq("id", employeeId);
    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      const emp = dbEmployees.find(e => e.id === employeeId);
      setToast(`تم تعيين "${emp ? empDisplayName(emp) : ""}" في منصب "${pos.title_ar}" بنجاح`);
      await Promise.all([refetch(), refetchPositions()]);
    }
    setSaving(false);
  }, [positions, dbEmployees, dbDepartments, refetch, refetchPositions]);

  // Add position
  const handleAddPosition = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setSaving(true);

    // Calculate level from parent
    let level = 0;
    if (addParentId) {
      const parent = positions.find(p => p.id === addParentId);
      if (parent) level = parent.level + 1;
    }

    const { error } = await supabase.from("positions").insert({
      title_ar: posForm.title_ar.trim(),
      title_en: posForm.title_en.trim() || null,
      department_id: posForm.department_id || null,
      reports_to_position_id: addParentId,
      max_headcount: parseInt(posForm.max_headcount) || 1,
      description: posForm.description.trim() || null,
      level,
    });

    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم إنشاء المنصب بنجاح");
      setShowAddPositionModal(false);
      setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
      await refetchPositions();
    }
    setSaving(false);
  }, [posForm, addParentId, positions, refetchPositions]);

  // Edit position
  const handleEditPosition = useCallback(async () => {
    if (!editingPosition || !posForm.title_ar.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("positions").update({
      title_ar: posForm.title_ar.trim(),
      title_en: posForm.title_en.trim() || null,
      department_id: posForm.department_id || null,
      max_headcount: parseInt(posForm.max_headcount) || 1,
      description: posForm.description.trim() || null,
    }).eq("id", editingPosition.id);

    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم تحديث المنصب بنجاح");
      setEditingPosition(null);
      setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
      await refetchPositions();
    }
    setSaving(false);
  }, [editingPosition, posForm, refetchPositions]);

  // Delete position
  const handleDeletePosition = useCallback(async (posId: string) => {
    if (!confirm("هل تريد حذف هذا المنصب؟")) return;
    setSaving(true);
    const { error } = await supabase.from("positions").delete().eq("id", posId);
    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم حذف المنصب");
      await refetchPositions();
    }
    setSaving(false);
  }, [refetchPositions]);

  const openAddModal = (parentId: string | null) => {
    setAddParentId(parentId);
    setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
    setShowAddPositionModal(true);
  };

  const openEditModal = (pos: PositionNode) => {
    setEditingPosition(pos);
    setPosForm({
      title_ar: pos.title_ar,
      title_en: pos.title_en || "",
      department_id: pos.department_id || "",
      max_headcount: String(pos.max_headcount),
      description: pos.description || "",
    });
  };

  if (posLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>اسحب بطاقة الموظف من القائمة اليسرى وأسقطها على المنصب المطلوب.</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>سيتم تعيين القسم والمدير تلقائياً بناءً على هيكل المناصب.</p>
        </div>
      </div>

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        {/* Sidebar: Unassigned employees */}
        <div className="w-72 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/30">
            <h3 className="text-foreground mb-2" style={{ fontSize: 14 }}>موظفون بدون منصب ({unassignedEmployees.length})</h3>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                placeholder="بحث..."
                className="w-full bg-background border border-border/40 rounded-lg ps-8 pe-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                style={{ fontSize: 12 }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredUnassigned.length > 0 ? filteredUnassigned.map(emp => (
              <DraggableEmployeeCard key={emp.id} emp={emp} deptColors={deptColors} />
            )) : (
              <p className="text-center text-muted-foreground py-6" style={{ fontSize: 12 }}>
                {empSearch ? "لا توجد نتائج" : "جميع الموظفين معينون في مناصب"}
              </p>
            )}
          </div>
        </div>

        {/* Main: Position tree */}
        <div className="flex-1 bg-card/20 border border-border/30 rounded-xl overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground" style={{ fontSize: 15 }}>هيكل المناصب</h3>
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري الحفظ...
                </div>
              )}
              <button onClick={() => openAddModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: 12 }}>
                <Plus className="w-3.5 h-3.5" /> منصب جديد
              </button>
            </div>
          </div>

          {positionTree.length > 0 ? (
            <div className="flex gap-6 justify-center" style={{ minWidth: "fit-content" }}>
              {positionTree.map(root => (
                <PositionCard key={root.id} node={root} depth={0} departments={dbDepartments}
                  employees={dbEmployees} deptColors={deptColors} onDrop={handleDrop}
                  onAddPosition={openAddModal} onDeletePosition={handleDeletePosition} onEditPosition={openEditModal}
                  expandedPositions={expandedPositions} togglePositionExpand={togglePositionExpand} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Network className="w-12 h-12 mb-4 opacity-30" />
              <p style={{ fontSize: 16 }}>لا توجد مناصب بعد</p>
              <p className="mt-2" style={{ fontSize: 13 }}>أنشئ المناصب أولاً ثم اسحب الموظفين لتعيينهم</p>
              <button onClick={() => openAddModal(null)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: 13 }}>
                <Plus className="w-4 h-4" /> إنشاء أول منصب
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Position Modal */}
      <AnimatePresence>
        {(showAddPositionModal || editingPosition) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowAddPositionModal(false); setEditingPosition(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-foreground" style={{ fontSize: 15 }}>
                    {editingPosition ? "تعديل المنصب" : "إضافة منصب جديد"}
                  </h3>
                </div>
                <button onClick={() => { setShowAddPositionModal(false); setEditingPosition(null); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>المسمى الوظيفي (عربي) *</label>
                  <input type="text" value={posForm.title_ar} onChange={e => setPosForm(p => ({ ...p, title_ar: e.target.value }))}
                    placeholder="مثال: مدير الموارد البشرية"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>المسمى الوظيفي (إنجليزي)</label>
                  <input type="text" value={posForm.title_en} onChange={e => setPosForm(p => ({ ...p, title_en: e.target.value }))}
                    placeholder="HR Manager" dir="ltr"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>القسم</label>
                  <select value={posForm.department_id} onChange={e => setPosForm(p => ({ ...p, department_id: e.target.value }))}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }}>
                    <option value="">بدون قسم</option>
                    {dbDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>الحد الأقصى للعدد</label>
                  <input type="number" value={posForm.max_headcount} onChange={e => setPosForm(p => ({ ...p, max_headcount: e.target.value }))}
                    min="1" max="100"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} dir="ltr" />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>الوصف</label>
                  <textarea value={posForm.description} onChange={e => setPosForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="وصف المنصب ومسؤولياته"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={() => { setShowAddPositionModal(false); setEditingPosition(null); }}
                  className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
                <button onClick={editingPosition ? handleEditPosition : handleAddPosition} disabled={saving || !posForm.title_ar.trim()}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50" style={{ fontSize: 13 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingPosition ? "حفظ التغييرات" : "إنشاء المنصب"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2 pointer-events-auto ${toast.startsWith("خطأ") ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
              <span className="text-foreground" style={{ fontSize: 12 }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      tree: { id: 0, dbId: "__root__", name: "المؤسسة", initials: "م", position: "الإدارة العليا", department: "الإدارة العليا", color: "#8B5CF6", photo: null, email: null, children: [] } as OrgNode,
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
    const newId = crypto.randomUUID();
    // Get max person_id
    const { data: maxRow } = await supabase.from("employees").select("person_id").order("person_id", { ascending: false }).limit(1);
    const nextPid = (maxRow?.[0]?.person_id ?? 0) + 1;
    const { error } = await supabase.from("employees").insert({
      id: newId,
      person_id: nextPid,
      name: name,
      arabic_name: name,
      department,
      position,
      manager_id: managerId,
      status: "نشط",
      monthly_salary: 0,
      currency: "IQD",
    });
    if (error) {
      console.error("Add employee error:", error);
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast(`تم إضافة "${name}" بنجاح للهيكل التنظيمي`);
      await refetch();
    }
    setSaving(false);
  }, [refetch]);

  const handleDeleteEmployee = useCallback(async (node: OrgNode, reparent: boolean) => {
    if (node.dbId === "__root__") return;
    setSaving(true);

    // Find parent's dbId
    const parent = findParentOf(orgTree, node.id);
    const parentDbId = parent && parent.dbId !== "__root__" ? parent.dbId : null;

    if (reparent && node.children.length > 0) {
      // Move children's manager_id to this node's parent
      const childDbIds = node.children.map(c => c.dbId);
      await supabase.from("employees").update({ manager_id: parentDbId }).in("id", childDbIds);
    } else if (!reparent && node.children.length > 0) {
      // Remove manager_id from all children (they become unlinked)
      const childDbIds = node.children.map(c => c.dbId);
      await supabase.from("employees").update({ manager_id: null }).in("id", childDbIds);
    }

    // Remove this employee's manager_id (unlink from hierarchy)
    await supabase.from("employees").update({ manager_id: null }).eq("id", node.dbId);

    setDeleteTarget(null);
    setSelectedNode(null);
    setToast("تم فصل الموظف من الهيكل التنظيمي");
    await refetch();
    setSaving(false);
  }, [orgTree, refetch]);

  const handleEditEmployee = useCallback(async (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => {
    if (dbId === "__root__") return;
    setSaving(true);
    const supaUpdates: any = {};
    if (updates.name !== undefined) {
      supaUpdates.name = updates.name;
      supaUpdates.arabic_name = updates.name;
    }
    if (updates.position !== undefined) supaUpdates.position = updates.position;
    if (updates.department !== undefined) supaUpdates.department = updates.department;
    if (updates.manager_id !== undefined) supaUpdates.manager_id = updates.manager_id;
    const { error } = await supabase.from("employees").update(supaUpdates).eq("id", dbId);
    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم تحديث بيانات الموظف بنجاح");
      setEditTarget(null);
      setSelectedNode(null);
      await refetch();
    }
    setSaving(false);
  }, [refetch]);

  const handleLinkEmployee = useCallback(async (empDbId: string, managerDbId: string) => {
    setSaving(true);
    const { error } = await supabase.from("employees").update({ manager_id: managerDbId }).eq("id", empDbId);
    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم ربط الموظف بمديره بنجاح");
      await refetch();
    }
    setSaving(false);
  }, [refetch]);

  const handleAddDepartment = useCallback(async (name: string, color: string) => {
    await supabase.from("departments").upsert({ name, color }, { onConflict: "name" });
  }, []);

  // Setup Owner → CEO + COO hierarchy
  const handleSetupHierarchy = useCallback(async () => {
    setSaving(true);
    try {
      // Check if Owner already exists
      const ownerExists = dbEmployees.some(e => e.department === "المالك" || e.position === "المالك");
      if (ownerExists) {
        setToast("الهيكل التنظيمي مُعد مسبقاً. استخدم أزرار التعديل لتغيير البيانات.");
        setSaving(false);
        return;
      }

      const ownerId = crypto.randomUUID();
      const ceoId = crypto.randomUUID();
      const cooId = crypto.randomUUID();

      // Get max person_id to assign new sequential ones
      const { data: maxRow } = await supabase.from("employees").select("person_id").order("person_id", { ascending: false }).limit(1);
      const maxPid = maxRow?.[0]?.person_id ?? 0;

      // 1. Insert Owner
      const { error: e1 } = await supabase.from("employees").insert({
        id: ownerId, person_id: maxPid + 1, name: "المالك", arabic_name: "المالك",
        department: "المالك", position: "المالك",
        manager_id: null, status: "نشط", monthly_salary: 0, currency: "IQD",
      });
      if (e1) { console.error("Owner insert error:", e1); setToast(`خطأ إنشاء المالك: ${e1.message}`); setSaving(false); return; }

      // 2. Insert CEO under Owner
      const { error: e2 } = await supabase.from("employees").insert({
        id: ceoId, person_id: maxPid + 2, name: "المدير التنفيذي", arabic_name: "المدير التنفيذي",
        department: "الإدارة العليا", position: "CEO",
        manager_id: ownerId, status: "نشط", monthly_salary: 0, currency: "IQD",
      });
      if (e2) { console.error("CEO insert error:", e2); setToast(`خطأ إنشاء CEO: ${e2.message}`); setSaving(false); return; }

      // 3. Insert COO under Owner
      const { error: e3 } = await supabase.from("employees").insert({
        id: cooId, person_id: maxPid + 3, name: "المدير التشغيلي", arabic_name: "المدير التشغيلي",
        department: "الإدارة العليا", position: "COO",
        manager_id: ownerId, status: "نشط", monthly_salary: 0, currency: "IQD",
      });
      if (e3) { console.error("COO insert error:", e3); setToast(`خطأ إنشاء COO: ${e3.message}`); setSaving(false); return; }

      // 4. Move all existing root employees (no manager) under CEO, EXCLUDING the newly created ones
      const newIds = new Set<string>([ownerId, ceoId, cooId]);
      const rootEmpIds = dbEmployees
        .filter(e => !e.manager_id && !newIds.has(e.id))
        .map(e => e.id);

      if (rootEmpIds.length > 0) {
        const { error: e4 } = await supabase.from("employees")
          .update({ manager_id: ceoId })
          .in("id", rootEmpIds);
        if (e4) console.error("Move root employees error:", e4);
      }

      // 5. Add Owner + C-Level departments
      await supabase.from("departments").upsert(
        { name: "المالك", color: OWNER_COLOR },
        { onConflict: "name" }
      );
      await supabase.from("departments").upsert(
        { name: "الإدارة العليا", color: CLEVEL_COLOR },
        { onConflict: "name" }
      );

      setToast("تم تهيئة الهيكل: المالك ← المدير التنفيذي + المدير التشغيلي — عدّل البيانات من زر التعديل");
      setShowSetupModal(false);
      await refetch();
    } catch (err: any) {
      console.error("Setup hierarchy error:", err);
      setToast(`خطأ: ${err?.message || "فشل تهيئة الهيكل التنظيمي"}`);
    }
    setSaving(false);
  }, [dbEmployees, refetch]);

  // ── Cleanup duplicate Owner/CEO/COO entries ──
  const handleCleanupDuplicates = useCallback(async () => {
    setSaving(true);
    try {
      // Find all Owner entries
      const owners = dbEmployees.filter(e => e.department === "المالك" || e.position === "المالك");
      // Find all CEO entries
      const ceos = dbEmployees.filter(e => e.position === "CEO" && e.department === "الإدارة العليا");
      // Find all COO entries
      const coos = dbEmployees.filter(e => e.position === "COO" && e.department === "الإدارة العليا");

      if (owners.length <= 1 && ceos.length <= 1 && coos.length <= 1) {
        setToast("لا توجد تكرارات في الهيكل التنظيمي");
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
          await supabase.from("employees").update({ manager_id: newManagerId }).eq("id", emp.id);
        }
      }

      // Now delete all duplicates (set their manager_id to null first, then delete)
      if (allDuplicateIds.size > 0) {
        const dupArr = Array.from(allDuplicateIds);
        // First remove any manager_id references to duplicates that might remain
        await supabase.from("employees").update({ manager_id: null }).in("id", dupArr);
        // Then delete the duplicate entries entirely
        await supabase.from("employees").delete().in("id", dupArr);
      }

      // Ensure kept Owner has no manager (is the true root)
      if (keepOwner) {
        await supabase.from("employees").update({ manager_id: null }).eq("id", keepOwner.id);
      }
      // Ensure kept CEO reports to kept Owner
      if (keepCeo && keepOwner) {
        await supabase.from("employees").update({ manager_id: keepOwner.id }).eq("id", keepCeo.id);
      }
      // Ensure kept COO reports to kept Owner
      if (keepCoo && keepOwner) {
        await supabase.from("employees").update({ manager_id: keepOwner.id }).eq("id", keepCoo.id);
      }

      const removedCount = allDuplicateIds.size;
      setToast(`تم تنظيف الهيكل — حُذف ${removedCount} إدخال مكرر وأُعيد ربط الموظفين بنجاح`);
      setShowCleanupModal(false);
      await refetch();
    } catch (err: any) {
      console.error("Cleanup error:", err);
      setToast(`خطأ: ${err?.message || "فشل تنظيف الهيكل"}`);
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
    const title = translateArabicSource("الهيكل التنظيمي", language);
    const subtitle = translateArabicSource("بنية المؤسسة وخريطة الأقسام", language);
    const footer = translateArabicSource("تم إنشاء هذا التقرير بتاريخ", language);
    const product = translateArabicSource("نظام الموارد البشرية", language);
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
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d"); if (!ctx) return;
      const el = chartContentRef.current; const scale = 2;
      canvas.width = el.scrollWidth * scale; canvas.height = el.scrollHeight * scale;
      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.scrollWidth}" height="${el.scrollHeight}">
        <foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="background:#0F0F0F;color:#FFF8E1;font-family:Tajawal,sans-serif;direction:rtl">${el.innerHTML}</div></foreignObject></svg>`;
      const img = new Image(); const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
      img.onload = () => { ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        canvas.toBlob(b => { if (!b) return; const a = document.createElement("a"); a.download = `${translateArabicSource("الهيكل التنظيمي").replace(/\s+/g, "-")}-${formatDate(new Date()).replace(/[\\/:]/g, "-")}.png`; a.href = URL.createObjectURL(b); a.click(); URL.revokeObjectURL(a.href); }); };
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
        <span className="text-muted-foreground ms-3">جاري تحميل الهيكل التنظيمي...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-gradient-gold">الهيكل التنظيمي</h1>
          <p className="text-muted-foreground mt-1">بنية المؤسسة وخريطة الأقسام — بيانات مباشرة من قاعدة البيانات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unlinkedEmps.length > 0 && (
            <button onClick={() => setShowUnlinked(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-all shadow-sm" style={{ fontSize: 13 }}>
              <AlertTriangle className="w-4 h-4" />
              {unlinkedEmps.length} بدون ربط
            </button>
          )}

          <button onClick={() => setShowSetupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-black hover:opacity-90 transition-all shadow-md" style={{ fontSize: 13, background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
            <Crown className="w-4 h-4" /> تهيئة الهيكل
          </button>

          <button onClick={() => setShowCleanupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all shadow-sm" style={{ fontSize: 13 }}>
            <Trash2 className="w-4 h-4" /> تنظيف التكرارات
          </button>

          <button onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md" style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> إضافة موظف
          </button>

          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input ref={searchInputRef} type="text" placeholder="بحث عن موظف..." value={searchQuery}
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
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>لا توجد نتائج لـ "{searchQuery}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all" style={{ fontSize: 13 }} title="طباعة">
            <Printer className="w-4 h-4" /><span className="hidden sm:inline">طباعة</span>
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all" style={{ fontSize: 13 }} title="تصدير PNG">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">تصدير</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
        <button onClick={() => setViewMode("tree")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "tree" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`} style={{ fontSize: 13 }}>
          <GitBranch className="w-4 h-4" /> الهيكل الحالي
        </button>
        <button onClick={() => setViewMode("positions")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "positions" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`} style={{ fontSize: 13 }}>
          <Network className="w-4 h-4" /> المناصب والتعيين
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
              ? <>الهيكل التنظيمي يُبنى تلقائياً من <span className="text-primary">هيكل المناصب</span> — عيّن الموظفين من تبويب "المناصب والتعيين".</>
              : <>الهيكل التنظيمي يُبنى تلقائياً من حقل <span className="text-primary">المدير المباشر (manager_id)</span> في بيانات كل موظف.</>
            }
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            {dbPositions.length > 0
              ? "المناصب الشاغرة تظهر بإطار متقطع. ألوان البطاقات تتبع لون القسم — يمكن تغييرها من الإعدادات."
              : "لتعيين مدير لموظف: عدّل بيانات الموظف من صفحة \"الموظفون\" أو استخدم زر \"إضافة موظف\" هنا مع تحديد المدير."
            }
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/30 rounded-xl p-3 text-center shadow-md">
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>إجمالي الموظفين</p>
          <span className="text-gradient-gold block mt-1" style={{ fontSize: 22 }}>{dbEmployees.length}</span>
          <p className="text-muted-foreground" style={{ fontSize: 10 }}>في {departmentStats.length} أقسام</p>
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
          <h3 className="text-foreground" style={{ fontSize: 15 }}>خريطة المؤسسة التفاعلية</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {saving && (
              <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري الحفظ...
              </div>
            )}
            <button onClick={() => setPanEnabled(!panEnabled)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${panEnabled ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              title={panEnabled ? "إيقاف السحب" : "تفعيل السحب للتنقل"}>
              <Move className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border/40" />
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="تصغير"><Minus className="w-4 h-4" /></button>
            <span className="text-muted-foreground min-w-[40px] text-center" style={{ fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="تكبير"><Plus className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1)} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="إعادة ضبط"><Maximize2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-border/40" />
            <button onClick={expandAll} className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>توسيع الكل</button>
            <button onClick={collapseAll} className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>طي الكل</button>
          </div>
        </div>

        <AnimatePresence>
          {panEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border-b border-primary/10 px-5 py-2 flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-primary" />
              <p className="text-primary" style={{ fontSize: 12 }}>وضع السحب مفعّل — اسحب بالفأرة للتنقل في الخريطة</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={containerRef} className={`overflow-auto p-8 ${panEnabled ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
          style={{ maxHeight: "75vh" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {dbEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p style={{ fontSize: 16 }}>لا يوجد موظفون في النظام بعد</p>
              <p className="mt-2" style={{ fontSize: 13 }}>أضف موظفين من صفحة "الموظفون" ثم حدد المدير المباشر لكل منهم</p>
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
                <span className="text-foreground" style={{ fontSize: 12 }}>{searchMatchIds.size} نتيجة لـ "{searchQuery}"</span>
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
            <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto ${toast.startsWith("خطأ") ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toast.startsWith("خطأ") ? "bg-red-500/20" : "bg-green-500/20"}`}>
                {toast.startsWith("خطأ") ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <UserCheck className="w-3 h-3 text-green-400" />}
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
                    <h3 className="text-foreground" style={{ fontSize: 15 }}>تهيئة الهيكل التنظيمي</h3>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>إنشاء هيكل: المالك ← CEO + COO</p>
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
                      <span className="text-yellow-400" style={{ fontSize: 13 }}>المالك</span>
                    </div>
                    <div className="w-px h-4 bg-border/60" />
                    <div className="flex items-center gap-6">
                      {/* CEO */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-px bg-border/60" />
                        <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                          <span className="text-foreground" style={{ fontSize: 12 }}>المدير التنفيذي (CEO)</span>
                        </div>
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                          {dbEmployees.filter(e => !e.manager_id).length > 0
                            ? `← ${dbEmployees.filter(e => !e.manager_id).length} موظف حالي`
                            : "بدون مرؤوسين"}
                        </p>
                      </div>
                      {/* COO */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-px bg-border/60" />
                        <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                          <span className="text-foreground" style={{ fontSize: 12 }}>المدير التشغيلي (COO)</span>
                        </div>
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>بدون مرؤوسين</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-foreground" style={{ fontSize: 12 }}>سيتم إنشاء 3 موظفين جدد:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground" style={{ fontSize: 11 }}>
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-yellow-400" /> <strong className="text-yellow-400">المالك</strong> — أعلى الهرم (ذهبي)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">المدير التنفيذي (CEO)</strong> — تحت المالك
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">المدير التشغيلي (COO)</strong> — تحت المالك
                    </li>
                  </ul>
                  {dbEmployees.filter(e => !e.manager_id).length > 0 && (
                    <p className="mt-2 text-amber-500" style={{ fontSize: 11 }}>
                      ⚠ سيتم نقل {dbEmployees.filter(e => !e.manager_id).length} موظف (بدون مدير حالياً) تحت المدير التنفيذي — يمكنك نقلهم لاحقاً
                    </p>
                  )}
                </div>

                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  يمكنك تعديل الأسماء والبيانات لاحقاً من خلال النقر على الكارد ثم زر التعديل في صفحة الموظفين.
                </p>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={() => setShowSetupModal(false)} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
                <button onClick={handleSetupHierarchy} disabled={saving}
                  className="px-5 py-2 rounded-lg text-black disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13, background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  {saving ? "جاري التهيئة..." : "تهيئة الهيكل"}
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
                    <h3 className="text-foreground" style={{ fontSize: 15 }}>تنظيف التكرارات</h3>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>حذف الإدخالات المكررة (المالك، CEO، COO)</p>
                  </div>
                </div>
                <button onClick={() => setShowCleanupModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-2">
                  <p className="text-foreground" style={{ fontSize: 13 }}>سيقوم النظام بـ:</p>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      حذف الإدخالات المكررة لـ "المالك" و"المدير التنفيذي" و"المدير التشغيلي"
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      الإبقاء على النسخة الأقدم من كل منصب
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      إعادة ربط جميع الموظفين المتأثرين تلقائياً
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                      ضمان هيكل واحد صحيح: المالك ← CEO + COO
                    </p>
                  </div>
                </div>

                <div className="bg-muted/10 border border-border/30 rounded-xl p-3">
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    التكرارات الحالية: <span className="text-red-400">{dbEmployees.filter(e => e.department === "المالك" || e.position === "المالك").length}</span> مالك، {" "}
                    <span className="text-red-400">{dbEmployees.filter(e => e.position === "CEO" && e.department === "الإدارة العليا").length}</span> CEO، {" "}
                    <span className="text-red-400">{dbEmployees.filter(e => e.position === "COO" && e.department === "الإدارة العليا").length}</span> COO
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400" style={{ fontSize: 12 }}>تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الإدخالات المكررة نهائياً.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={() => setShowCleanupModal(false)} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>إلغاء</button>
                <button onClick={handleCleanupDuplicates} disabled={saving}
                  className="px-5 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {saving ? "جاري التنظيف..." : "تنظيف التكرارات"}
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
