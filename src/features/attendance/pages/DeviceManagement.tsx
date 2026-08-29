import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as odooData from "@/shared/api/odooData";
import type {
  BiometricDevice,
  DeviceManagementTab,
} from "@/features/attendance/types";
import {
  getDefaultBiometricDevice,
  mapBiometricDevices,
} from "@/features/attendance/utils/deviceManagement";
import DeviceManagementHeader from "../components/DeviceManagementHeader";
import DeviceManagementTabs from "../components/DeviceManagementTabs";

const DeviceOverviewTab = lazy(() => import("../components/DeviceOverviewTab"));
// const DevicePersonsTab = lazy(() => import("../components/DevicePersonsTab"));
const DeviceEventsTab = lazy(() => import("../components/DeviceEventsTab"));
const DeviceFaceTab = lazy(() => import("../components/DeviceFaceTab"));

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
          <Suspense fallback={null}>
            {tab === "overview" && <DeviceOverviewTab />}
            {/* {tab === "persons" && <DevicePersonsTab />} */}
            {tab === "events" && <DeviceEventsTab />}
            {tab === "face" && <DeviceFaceTab />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeviceManagement;
