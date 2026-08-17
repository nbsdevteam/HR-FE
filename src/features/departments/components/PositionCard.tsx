import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, ChevronDown, Minus, Plus, Maximize2, Search, Printer, Download,
  Move, X, UserPlus, Trash2, Building2, UserCheck, Briefcase, ChevronLeft,
  Loader2, AlertTriangle, Link2, Crown, Edit2, Network, GripVertical, Save, ChevronRight as ChevronRightIcon, GitBranch
} from "lucide-react";
import { empDisplayName } from "@/shared/hooks";
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
  buildPositionTree,
  countDescendants,
  findParentOf,
  flattenTree,
  pickUniqueColor,
} from "../utils/hierarchyTree";

const PositionCard = ({
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
}) => {
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
                <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{dept?.name || arabicSource("common.no_section")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEditPosition(node)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-blue-500/20 transition-colors" title={arabicSource("common.edit")}>
                <Edit2 className="w-3 h-3 text-blue-400" />
              </button>
              <button onClick={() => onAddPosition(node.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/20 transition-colors" title={arabicSource("hierarchy.add_a_sub_position")}>
                <Plus className="w-3 h-3 text-primary" />
              </button>
              {node.assignedEmployees.length === 0 && node.children.length === 0 && (
                <button onClick={() => onDeletePosition(node.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors" title={arabicSource("common.delete")}>
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
                {dragOver ? arabicSource("common.drop_here_to_set") : `${vacancies} ${arabicSource("common.vacant")}`}
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

};

export default PositionCard;
