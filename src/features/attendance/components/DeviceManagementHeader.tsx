import type { BiometricDevice } from "../types";
import { arabicSource } from "@/i18n/source";
// import DeviceSelectOption from "./DeviceSelectOption";

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
    {/* {devices.length > 1 && (
      <select
        className="backdrop-blur-md rounded-lg px-3 py-2 text-sm border border-border/20 bg-transparent text-foreground"
        value={selectedDevice}
        onChange={(event) => onSelectedDeviceChange(event.target.value)}
      >
        {devices.map((device) => (
          <DeviceSelectOption key={device.id} device={device} />
        ))}
      </select>
    )} */}
  </div>
);

export default DeviceManagementHeader;
