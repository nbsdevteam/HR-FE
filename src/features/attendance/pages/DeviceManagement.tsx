import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as odooData from "@/shared/api/odooData";
import type { BiometricDevice, DeviceManagementTab } from "@/features/attendance/types";
import {
  getDefaultBiometricDevice,
  mapBiometricDevices,
} from "@/features/attendance/utils/deviceManagement";
import DeviceEventsTab from "../components/DeviceEventsTab";
import DeviceFaceTab from "../components/DeviceFaceTab";
import DeviceManagementHeader from "../components/DeviceManagementHeader";
import DeviceManagementTabs from "../components/DeviceManagementTabs";
import DeviceOverviewTab from "../components/DeviceOverviewTab";
import DevicePersonsTab from "../components/DevicePersonsTab";

const DeviceManagement = () => {
  const [tab, setTab] = useState<DeviceManagementTab>("overview");
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");

  const handleTabChange = useCallback((nextTab: DeviceManagementTab) => {
    setTab(nextTab);
  }, []);

  const handleSelectedDeviceChange = useCallback((deviceId: string) => {
    setSelectedDevice(deviceId);
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      const rows = await odooData.fetchDevices().catch(() => []);

      if (rows && rows.length > 0) {
        const mapped = mapBiometricDevices(rows);
        setDevices(mapped);
        setSelectedDevice(mapped[0].id);
        return;
      }

      const defaultDevice = getDefaultBiometricDevice();
      setDevices([defaultDevice]);
      setSelectedDevice(defaultDevice.id);
    };

    loadDevices();
  }, []);

  return (
    <div className="space-y-6">
      <DeviceManagementHeader
        devices={devices}
        selectedDevice={selectedDevice}
        onSelectedDeviceChange={handleSelectedDeviceChange}
      />

      <DeviceManagementTabs activeTab={tab} onTabChange={handleTabChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && <DeviceOverviewTab />}
          {tab === "persons" && <DevicePersonsTab />}
          {tab === "events" && <DeviceEventsTab />}
          {tab === "face" && <DeviceFaceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeviceManagement;
