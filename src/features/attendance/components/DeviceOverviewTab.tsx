import { useCallback, useEffect, useState } from "react";
import { LoadingState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DeviceCapacity, DeviceInfo } from "../types";
import { DEVICE_SYNC_API } from "../utils/deviceManagement";
import DeviceCapacitySection from "./DeviceCapacitySection";
import DeviceDoorControl from "./DeviceDoorControl";
import DeviceInfoCard from "./DeviceInfoCard";

const DeviceOverviewTab = () => {
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [capacity, setCapacity] = useState<DeviceCapacity | null>(null);
  const [network, setNetwork] = useState<any>(null);
  const [door, setDoor] = useState<any>(null);
  const [deviceIp, setDeviceIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [doorLoading, setDoorLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${DEVICE_SYNC_API}/device/info`);
      const data = await response.json();
      if (data.success) {
        setInfo(data.info);
        setCapacity(data.capacity);
        setNetwork(data.network);
        setDoor(data.door);
        setDeviceIp(data.deviceIp || data.network?.ipAddress || "");
      }
    } catch {
      // Device can be offline.
    }
    setLoading(false);
  }, []);

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

  useEffect(() => {
    load();
  }, [load]);

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
        info={info}
        network={network}
        door={door}
        deviceIp={deviceIp}
        onRefresh={load}
      />
      {capacity && <DeviceCapacitySection capacity={capacity} />}
      {/* <DeviceDoorControl loading={doorLoading} onDoorAction={handleDoor} /> */}
    </div>
  );
};

export default DeviceOverviewTab;
