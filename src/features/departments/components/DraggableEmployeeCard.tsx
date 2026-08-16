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

export const DraggableEmployeeCard = ({ emp, deptColors }: { emp: DbEmployee; deptColors: Record<string, string> }) => {
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

};
