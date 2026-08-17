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

const DetailPanel = ({ node, orgTree, onClose, onAddChild, onDelete, onEdit }: {
  node: OrgNode; orgTree: OrgNode; onClose: () => void;
  onAddChild: (parentId: number) => void; onDelete: (node: OrgNode) => void;
  onEdit: (node: OrgNode) => void;
}) => {
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
              <button onClick={() => onAddChild(node.id)} className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors" title={arabicSource("hierarchy.add_a_subordinate")}>
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {!isRoot && !isVirtualRoot && (
              <button onClick={() => onEdit(node)} className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title={arabicSource("hierarchy.modify_data")}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isRoot && !isVirtualRoot && (
              <button onClick={() => onDelete(node)} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title={arabicSource("common.separation_from_the_structure")}>
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
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.employee_number")}</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>EMP-{String(node.id).padStart(4, "0")}</span>
            </div>
            {parentNode && parentNode.dbId !== "__root__" && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.direct_manager")}</span>
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
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.direct_manager")}</span>
                <span className="text-primary" style={{ fontSize: 12 }}>{arabicSource("common.without_a_manager_top_of_the_pyramid")}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.direct_reports")}</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>{node.children.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("hierarchy.total_team")}</span>
              <span className="text-foreground" style={{ fontSize: 12 }}>{countDescendants(node)}</span>
            </div>
            {node.email && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.post")}</span>
                <span className="text-foreground" style={{ fontSize: 12, direction: "ltr" }}>{node.email}</span>
              </div>
            )}
          </div>
        )}

        {node.children.length > 0 && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("common.direct_reports")}</p>
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
            <UserPlus className="w-4 h-4" /> {arabicSource("hierarchy.add_a_new_subordinate")}
          </button>
        )}
      </div>
    </motion.div>
  );

};

export default DetailPanel;
