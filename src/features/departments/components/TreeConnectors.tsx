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

export const TreeConnectors = ({ parentRef, childRefs, color }: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  childRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  color: string;
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

};
