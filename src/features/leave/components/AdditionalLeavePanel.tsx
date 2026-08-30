import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button, ConfirmDeleteModal } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import {
  useLeaveEntitlementAdjustments,
  type DbLeaveBalanceItem,
  type DbLeaveEntitlementAdjustment,
  type DbLeaveType,
} from "@/shared/hooks";
import { leaveCardClass } from "../styles";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";
import { useAdditionalLeavePermissions } from "../hooks/useAdditionalLeavePermissions";
import AdditionalLeaveEntitlementRow from "./AdditionalLeaveEntitlementRow";
import AdditionalLeaveGrantModal from "./AdditionalLeaveGrantModal";
import AdditionalLeaveHistoryTable from "./AdditionalLeaveHistoryTable";
import LeaveFormError from "./LeaveFormError";

type AdditionalLeavePanelProps = {
  employeeId: string;
  /** Balance items eligible for grants — `requires_allocation` types only (backend v1.17.0 §3). */
  entitlementItems: DbLeaveBalanceItem[];
  /** Full catalogue, so the grant form can offer the same localized chip picker as the leave-request form. */
  leaveTypes: DbLeaveType[];
  yearsOfService: number | null;
  /** Refetches `/leave/balances` so the entitlement breakdown and `remaining` figures pick up a grant/void immediately. */
  onBalanceChanged: () => Promise<void> | void;
};

/**
 * Additional Annual Leave management (backend v1.17.0 §3, §4): entitlement
 * breakdown, "Grant"/"Void" actions, and the grant audit history. Renders
 * nothing when the employee has no leave type that takes an allocation, so
 * tenants without this feature enabled see the accrual panel unchanged.
 */
const AdditionalLeavePanel = ({
  employeeId,
  entitlementItems,
  leaveTypes,
  yearsOfService,
  onBalanceChanged,
}: AdditionalLeavePanelProps) => {
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState<DbLeaveEntitlementAdjustment | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");

  const { canManage } = useAdditionalLeavePermissions();
  const { adjustments, loading, refetch } = useLeaveEntitlementAdjustments(employeeId, {
    includeInactive: true,
  });

  const grantEligibleLeaveTypes = useMemo(() => {
    const eligibleIds = new Set(entitlementItems.map((item) => item.leave_type_id));
    return leaveTypes.filter((leaveType) => eligibleIds.has(leaveType.id));
  }, [entitlementItems, leaveTypes]);

  const handleOpenGrant = useCallback(() => setShowGrantModal(true), []);
  const handleCloseGrant = useCallback(() => setShowGrantModal(false), []);

  const handleCreated = useCallback(async () => {
    setShowGrantModal(false);
    await Promise.all([refetch(), onBalanceChanged()]);
  }, [refetch, onBalanceChanged]);

  const handleRequestVoid = useCallback((adjustment: DbLeaveEntitlementAdjustment) => {
    setVoidError("");
    setVoidTarget(adjustment);
  }, []);

  const handleCancelVoid = useCallback(() => {
    if (voiding) return;
    setVoidTarget(null);
  }, [voiding]);

  const handleConfirmVoid = useCallback(async () => {
    if (!voidTarget) return;
    setVoiding(true);
    setVoidError("");
    try {
      await odooData.deactivateLeaveEntitlementAdjustment(voidTarget.id);
      setVoiding(false);
      setVoidTarget(null);
      await Promise.all([refetch(), onBalanceChanged()]);
    } catch (e: unknown) {
      setVoidError(leaveErrorMessage(e, arabicSource("leave.error_void_additional_leave_failed")));
      setVoiding(false);
    }
  }, [voidTarget, refetch, onBalanceChanged]);

  if (entitlementItems.length === 0) return null;

  return (
    <div className={`${leaveCardClass} p-5 space-y-4`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-foreground" style={{ fontSize: 14 }}>
          {arabicSource("leave.additional_annual_leave")}
        </h4>
        {canManage && grantEligibleLeaveTypes.length > 0 && (
          <Button size="sm" icon={Plus} onClick={handleOpenGrant}>
            {arabicSource("leave.grant_additional_leave")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {entitlementItems.map((item) => (
          <AdditionalLeaveEntitlementRow key={item.leave_type_id} item={item} />
        ))}
      </div>

      {yearsOfService != null && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("leave.years_of_service_label")} <span dir="ltr">{yearsOfService.toFixed(2)}</span>{" "}
          {arabicSource("leave.years_of_service_reference_note")}
        </p>
      )}

      <LeaveFormError message={voidError} />

      {!loading && (
        <AdditionalLeaveHistoryTable items={adjustments} canManage={canManage} onVoid={handleRequestVoid} />
      )}

      <AnimatePresence>
        {showGrantModal && (
          <AdditionalLeaveGrantModal
            employeeId={employeeId}
            leaveTypes={grantEligibleLeaveTypes}
            onClose={handleCloseGrant}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      {voidTarget && (
        <ConfirmDeleteModal
          onClose={handleCancelVoid}
          onConfirm={handleConfirmVoid}
          title={arabicSource("leave.void_additional_leave_title")}
          message={arabicSource("leave.void_additional_leave_message")}
          confirmLabel={arabicSource("leave.additional_leave_void")}
          loading={voiding}
        />
      )}
    </div>
  );
};

export default AdditionalLeavePanel;
