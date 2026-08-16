import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  ClipboardCheck, Star, X, Eye, ChevronDown, Loader2, UserCheck, Save, Pencil,
  CheckCircle, Trash2,
} from "lucide-react";
import { localizedConfirm } from "@/i18n/native";
import * as odooData from "@/shared/api/odooData";
import { EmployeeSelect } from "@/features/employees";
import { EmptyState } from "@/shared/components/EmptyState";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { CustomRadarChart } from "@/shared/components/custom-radar-chart";
import { arabicSource } from "@/i18n/source";
import {
  defaultCriteria as DEFAULT_CRITERIA,
  evaluationCycles as EVAL_CYCLES,
  evaluationStatusColors as STATUS_COLORS,
  evaluationStatusToOdoo as EVAL_STATUS_TO_ODOO,
  type DbEvalCriteria,
  type DbEvaluation,
  type EvalCycleType,
} from "../types";
import { evaluationInputClass as inputCls } from "../styles";
import { getPeriodOptions, getRatingInfo, renderStars } from "../utils/evaluationHelpers";

export const KanbanView = function KanbanView({
  evaluations,
  empMap,
  criteria,
  onSelect,
}: {
  evaluations: DbEvaluation[];
  empMap: Record<string, DbEmployee>;
  criteria: DbEvalCriteria[];
  onSelect: (ev: DbEvaluation) => void;
}) {
  const columns = [
    { key: arabicSource("common.complete"), label: arabicSource("common.complete"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
    { key: arabicSource("common.under_evaluation"), label: arabicSource("common.under_evaluation"), accent: "border-primary/40", dotColor: "bg-primary" },
    { key: arabicSource("common.did_not_start"), label: arabicSource("common.did_not_start"), accent: "border-muted-foreground/40", dotColor: "bg-muted-foreground" },
  ];

  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {columns.map((col, ci) => {
        const items = evaluations.filter(e => e.status === col.key);
        return (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.1 }}
            className={`bg-card/20 backdrop-blur-md border ${col.accent} rounded-xl shadow-lg overflow-hidden`}
          >
            <div className="p-4 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <span className="text-foreground" style={{ fontSize: 14 }}>{col.label}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
                {items.length}
              </span>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {items.length > 0 ? items.map((ev, i) => {
                const emp = empMap[ev.employee_id];
                const ratingInfo = getRatingInfo(ev.overall_rating);
                const evaluator = ev.evaluator_id ? empMap[ev.evaluator_id] : null;
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => onSelect(ev)}
                    className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-primary" style={{ fontSize: 12 }}>
                          {emp ? empDisplayName(emp).charAt(0) : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{emp?.department || ""}</p>
                      </div>
                    </div>
                    {ev.overall_rating > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">{renderStars(ev.overall_rating, 14)}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-md border ${ratingInfo.bgColor}`} style={{ fontSize: 10 }}>
                          {ratingInfo.label}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("evaluation.not_evaluated_yet")}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                        {evaluator ? empDisplayName(evaluator) : "—"}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>{ev.period}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <EmptyState icon={ClipboardCheck} message={arabicSource("evaluation.there_are_no_reviews")} className="py-8" />
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ══════════════════════════ Detail Modal ══════════════════════════

