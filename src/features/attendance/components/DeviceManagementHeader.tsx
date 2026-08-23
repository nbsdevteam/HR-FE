import type { BiometricDevice } from "../types";
import { arabicSource } from "@/i18n/source";

type DeviceManagementHeaderProps = {
  devices: BiometricDevice[];
  selectedDevice: string;
  onSelectedDeviceChange: (deviceId: string) => void;
};

const DeviceManagementHeader = ({
  devices,
  selectedDevice,
  onSelectedDeviceChange,
}: DeviceManagementHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">
        {arabicSource("common.fingerprint_devices")}
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        {arabicSource(
          "devicemanagement.management_of_biometric_attendance_and_departure_devices",
        )}
      </p>
    </div>
    {/*
      Multi-device picker is disabled for now. When it comes back, render the
      shared `Select` from `@/shared/components` over `devices` /
      `selectedDevice` / `onSelectedDeviceChange` rather than a raw <select>.
    */}
  </div>
);

export default DeviceManagementHeader;
