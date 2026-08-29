import { useCallback } from "react";
import { Timer } from "lucide-react";
import { DataTable, EmptyState, LoadingState, TableHeaderRow } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import type { DbLeavePermission } from "@/shared/hooks";
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
      <LoadingState
        wrapperClassName="flex items-center justify-center h-32"
        iconClassName="w-6 h-6 text-primary animate-spin"
      />
    );
  }

  return (
    <DataTable
      wrapperClassName={cardCls}
      items={permissions}
      header={<TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("common.date"), arabicSource("common.from"), arabicSource("common.to"), arabicSource("common.duration"), arabicSource("common.the_reason"), arabicSource("common.status"), arabicSource("common.procedures")]} />}
      renderRow={(p, i) => (
        <PermissionTableRow
          key={p.id}
          permission={p}
          index={i}
          employee={empMap[p.employee_id]}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      emptyRow={
        <tr>
          <td colSpan={8}><EmptyState icon={Timer} message={arabicSource("leave.there_are_no_permission_requests")} /></td>
        </tr>
      }
    />
  );
};

export default PermissionsTab;
