import { HardDrive, RefreshCw } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DeviceInfo } from "../types";
import DeviceStatusBadge from "./DeviceStatusBadge";

type DeviceInfoCardProps = {
  info: DeviceInfo | null;
  network: any;
  door: any;
  deviceIp: string;
  onRefresh: () => void;
};

const DeviceInfoCard = ({ info, network, door, deviceIp, onRefresh }: DeviceInfoCardProps) => (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-foreground flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-primary" />
        {arabicSource("devicemanagement.device_information")}
      </h3>
      <div className="flex items-center gap-2">
        <DeviceStatusBadge active={!!info} />
        <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
    {info && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: arabicSource("devicemanagement.device_name"), value: info.deviceName },
          { label: arabicSource("devicemanagement.model"), value: info.model },
          { label: arabicSource("common.serial_number"), value: info.serialNumber },
          { label: arabicSource("devicemanagement.software_version"), value: info.firmwareVersion },
          { label: arabicSource("devicemanagement.ip_address"), value: deviceIp || network?.ipAddress || "—" },
          { label: "MAC Address", value: info.macAddress || network?.macAddress || "—" },
          { label: arabicSource("devicemanagement.door_name"), value: door?.doorName || "—" },
          {
            label: arabicSource("devicemanagement.duration_of_opening_the_door"),
            value: door?.openDuration ? `${door.openDuration} ${arabicSource("devicemanagement.seconds")}` : "—",
          },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <p className="text-sm text-foreground font-mono" dir="ltr">{item.value || "—"}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default DeviceInfoCard;
