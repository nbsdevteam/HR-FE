import { useCallback } from "react";
import { Loader2, Timer } from "lucide-react";
import { EmptyState, TableHeaderRow } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import { empDisplayName, type DbLeavePermission } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { leaveCardClass as cardCls } from "../styles";
import PermissionTableRow from "./PermissionTableRow";

const PermissionsTab = ({
  permissions, empMap, loading, refetch,
}: {
  permissions: DbLeavePermission[];
  empMap: Record<string, any>;
  loading: boolean;
  refetch: () => void;
}) => {
  const handleApprove = useCallback(async (id: string) => {
    await odooData.updateLeavePermission(id, "approved");
    refetch();
  }, [refetch]);

  const handleReject = useCallback(async (id: string) => {
    await odooData.updateLeavePermission(id, "refused");
    refetch();
  }, [refetch]);

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
            <TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("common.date"), arabicSource("common.from"), arabicSource("common.to"), arabicSource("common.duration"), arabicSource("common.the_reason"), arabicSource("common.status"), arabicSource("common.procedures")]} />
          </thead>
          <tbody>
            {permissions.length > 0 ? permissions.map((p, i) => (
              <PermissionTableRow
                key={p.id}
                permission={p}
                index={i}
                empName={empMap[p.employee_id] ? empDisplayName(empMap[p.employee_id]) : "—"}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )) : (
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
