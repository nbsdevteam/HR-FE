import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, ChevronDown, UserPlus, Crown } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { CLEVEL_COLOR } from "../styles";
import { countDescendants } from "../utils/hierarchyTree";
import TreeConnectors from "./TreeConnectors";
import NodeAvatar from "./NodeAvatar";

const OrgCard = ({
  node, depth = 0, expandedMap, toggleExpand, onSelect, selectedId, highlightedIds, searchMatchIds, deptColors,
}: {
  node: OrgNode; depth?: number; expandedMap: Record<number, boolean>; toggleExpand: (id: number) => void;
  onSelect: (node: OrgNode) => void; selectedId: number | null; highlightedIds: Set<number>; searchMatchIds: Set<number>;
  deptColors: Record<string, string>;
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedMap[node.id] ?? depth < 2;
  const topColor = deptColors[node.department] || node.color;
  const isSelected = selectedId === node.id;
  const isSearchMatch = searchMatchIds.has(node.id);
  const isHighlighted = highlightedIds.has(node.id);
  const totalChildren = countDescendants(node);
  const isDimmed = searchMatchIds.size > 0 && !isSearchMatch && !isHighlighted;
  const isOwner = node.department === arabicSource("common.owner");
  const isCLevel = node.department === arabicSource("common.senior_management");
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
                  {isVacant ? arabicSource("common.vacant") : node.name}
                </p>
                <p className={`truncate ${isCLevel ? "text-purple-400" : "text-muted-foreground"}`} style={{ fontSize: 11 }}>{node.position}</p>
              </div>
            </div>

            {/* Extra employees (headcount > 1) */}
            {extraEmps.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                {extraEmps.map(emp => (
                  <div key={emp.id} className="flex items-center gap-1.5">
                    <NodeAvatar photo={emp.photo} name={emp.name} color={topColor} initials={emp.name.charAt(0)} sizeClassName="w-5 h-5" extraClassName="shrink-0" fontSize={8} />
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

};

export default OrgCard;
