import { useCallback, useState } from "react";
import { LoadingState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { DeviceCapacity, DeviceInfo } from "../types";
import { DEVICE_SYNC_API } from "../utils/deviceManagement";
import DeviceCapacitySection from "./DeviceCapacitySection";
import DeviceInfoCard from "./DeviceInfoCard";

interface DeviceOverview {
  info: DeviceInfo | null;
  capacity: DeviceCapacity | null;
  network: any;
  door: any;
  deviceIp: string;
}

const EMPTY_OVERVIEW: DeviceOverview = {
  info: null,
  capacity: null,
  network: null,
  door: null,
  deviceIp: "",
};

const loadDeviceOverview = async (): Promise<DeviceOverview> => {
  try {
    const response = await fetch(`${DEVICE_SYNC_API}/device/info`);
    const data = await response.json();
    if (data.success) {
      return {
        info: data.info,
        capacity: data.capacity,
        network: data.network,
        door: data.door,
        deviceIp: data.deviceIp || data.network?.ipAddress || "",
      };
    }
  } catch {
    // Device can be offline.
  }
  return EMPTY_OVERVIEW;
};

const DeviceOverviewTab = () => {
  const [doorLoading, setDoorLoading] = useState(false);

  const { data, loading, refetch } = useAsyncList<DeviceOverview>(
    async () => [await loadDeviceOverview()],
    [],
    "Failed to load device information",
  );
  const overview = data[0] ?? EMPTY_OVERVIEW;

  const handleDoor = useCallback(async (action: "open" | "close") => {
    setDoorLoading(true);
    try {
      await fetch(`${DEVICE_SYNC_API}/device/door/${action}`, {
        method: "POST",
      });
    } catch {
      // Device can be offline.
    }
    setDoorLoading(false);
  }, []);

  if (loading) {
    return (
      <LoadingState
        message={arabicSource("devicemanagement.loading_device_information")}
        wrapperClassName="flex items-center justify-center py-20"
        iconClassName="w-6 h-6 animate-spin text-primary"
      />
    );
  }

  return (
    <div className="space-y-6">
      <DeviceInfoCard
        info={overview.info}
        network={overview.network}
        door={overview.door}
        deviceIp={overview.deviceIp}
        onRefresh={refetch}
      />
      {overview.capacity && <DeviceCapacitySection capacity={overview.capacity} />}
      {/* <DeviceDoorControl loading={doorLoading} onDoorAction={handleDoor} /> */}
    </div>
  );
};

export default DeviceOverviewTab;
