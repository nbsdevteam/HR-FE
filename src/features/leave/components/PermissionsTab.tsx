import { motion } from "motion/react";
import { Check, Loader2, Timer, X } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import * as odooData from "@/shared/api/odooData";
import { empDisplayName, type DbLeavePermission } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { leaveCardClass as cardCls, leaveStatusColors as statusColors } from "../styles";

const PermissionsTab = ({
  permissions, empMap, loading, refetch,
}: {
  permissions: DbLeavePermission[];
  empMap: Record<string, any>;
  loading: boolean;
  refetch: () => void;
}) => {
  const handleApprove = async (id: string) => {
    await odooData.updateLeavePermission(id, "approved");
    refetch();
  };
  const handleReject = async (id: string) => {
    await odooData.updateLeavePermission(id, "refused");
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={cardCls}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20 border-b border-border/20">
              {[arabicSource("common.employee"), arabicSource("common.date"), arabicSource("common.from"), arabicSource("common.to"), arabicSource("common.duration"), arabicSource("common.the_reason"), arabicSource("common.status"), arabicSource("common.procedures")].map(h => (
                <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.length > 0 ? permissions.map((p, i) => {
              const emp = empMap[p.employee_id];
              const empName = emp ? empDisplayName(emp) : "—";
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{empName}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.date}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.start_time?.substring(0, 5)}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.end_time?.substring(0, 5)}</td>
                  <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{p.hours} {arabicSource("common.hours")}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{p.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md border ${statusColors[p.status] || ""}`} style={{ fontSize: 12 }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === arabicSource("common.pending") && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleApprove(p.id)} className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors cursor-pointer">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button onClick={() => handleReject(p.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer">
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              );
            }) : (
              <tr>
                <td colSpan={8}><EmptyState icon={Timer} message={arabicSource("leave.there_are_no_permission_requests")} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsTab;

