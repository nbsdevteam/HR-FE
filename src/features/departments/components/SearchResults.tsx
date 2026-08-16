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

export const SearchResults = ({ results, onSelect, onClose }: {
  results: OrgNode[]; onSelect: (node: OrgNode) => void; onClose: () => void;
}) => {
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

};
