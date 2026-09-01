import { useState, useCallback } from "react";
import { RadioTower } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import StatusBadge from "@/shared/components/StatusBadge";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useDeviceSyncPause } from "../hooks/useDeviceSyncPause";
import { formatDeviceSyncChangedAt } from "../utils/deviceSyncFormat";
import SettingsToggle from "./SettingsToggle";
import DeviceSyncPauseModal from "./DeviceSyncPauseModal";
import SettingsSectionCard from "./SettingsSectionCard";

type TDeviceSyncPauseCardProps = {
  showToast: (message: string) => void;
};

const DeviceSyncPauseCard = ({ showToast }: TDeviceSyncPauseCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { deviceSync, loading: bootstrapLoading } = useSettingsBootstrap();
  const { state, loading, saving, updatePaused } = useDeviceSyncPause(showToast, deviceSync, bootstrapLoading);

  const paused = state?.paused ?? false;
  const lastChange = state?.last_change;

  const handleToggleClick = useCallback((): void => {
    setReason("");
    setModalOpen(true);
  }, []);

  const handleModalCancel = useCallback((): void => {
    setModalOpen(false);
  }, []);

  const handleModalConfirm = useCallback(async (): Promise<void> => {
    const ok = await updatePaused(!paused, reason.trim() || undefined);
    if (ok) setModalOpen(false);
  }, [updatePaused, paused, reason]);

  return (
    <SettingsSectionCard
      icon={RadioTower}
      title={arabicSource("settings.device_sync_pause_title")}
      description={arabicSource("settings.device_sync_pause_description")}
      delay={0.25}
    >
      {loading ? (
        <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {paused
                  ? arabicSource("settings.device_sync_status_paused")
                  : arabicSource("settings.device_sync_status_active")}
              </span>
              <StatusBadge
                colorClassName={
                  paused
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20"
                }
              >
                {paused
                  ? arabicSource("settings.device_sync_status_paused")
                  : arabicSource("settings.device_sync_status_active")}
              </StatusBadge>
            </div>
            <SettingsToggle on={paused} onClick={handleToggleClick} />
          </div>

          {lastChange && (
            <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-1">
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("settings.device_sync_last_change")}{" "}
                {formatDeviceSyncChangedAt(lastChange.changed_at)}
                {" — "}
                {arabicSource("settings.device_sync_changed_by")} {lastChange.actor_name}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                {lastChange.reason || arabicSource("settings.device_sync_no_reason")}
              </p>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <DeviceSyncPauseModal
          pausing={!paused}
          reason={reason}
          saving={saving}
          onReasonChange={setReason}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </SettingsSectionCard>
  );
};

export default DeviceSyncPauseCard;
