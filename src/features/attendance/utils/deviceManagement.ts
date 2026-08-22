import type { ElementType } from "react";
import { Camera, Activity, Server } from "lucide-react";
import { SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import type {
  BiometricDevice,
  DeviceManagementTab,
  DevicePerson,
} from "../types";

export const DEVICE_SYNC_API = SYNC_API;

export const getDeviceManagementTabs = (): Array<{
  key: DeviceManagementTab;
  label: string;
  icon: ElementType;
}> => [
  { key: "overview", label: arabicSource("common.overview"), icon: Server },
  // { key: "persons", label: arabicSource("devicemanagement.people_management"), icon: Users },
  {
    key: "events",
    label: arabicSource("devicemanagement.event_log"),
    icon: Activity,
  },
  {
    key: "face",
    label: arabicSource("devicemanagement.face_pictures"),
    icon: Camera,
  },
];

export const getDefaultBiometricDevice = (): BiometricDevice => ({
  id: "default",
  name: arabicSource("devicemanagement.the_main_fingerprint_device"),
  model: "DS-K1T342MFWX",
  ip_address: "192.168.15.15",
  is_active: true,
});

export const mapBiometricDevices = (rows: any[]): BiometricDevice[] =>
  rows.map((device: any) => ({
    id: String(device.id),
    name: device.name || "",
    model: device.model || "",
    ip_address: device.ip_address || "",
    is_active: device.is_active ?? device.active ?? true,
  }));

export const userTypeLabel = (type: string): string => {
  if (type === "normal") return arabicSource("devicemanagement.normal");
  if (type === "visitor") return arabicSource("devicemanagement.visitor");
  if (type === "blackList") return arabicSource("devicemanagement.blocked");
  return type;
};

export const userTypeColor = (type: string): string => {
  if (type === "normal")
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (type === "visitor")
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
};

export const filterDevicePersons = (
  persons: DevicePerson[],
  search: string,
): DevicePerson[] => {
  if (!search) return persons;
  const query = search.toLowerCase();
  return persons.filter(
    (person) =>
      person.name.toLowerCase().includes(query) ||
      person.employeeNo.includes(query),
  );
};

export const formatDeviceEventTime = (time: string): string => {
  if (!time) return "—";
  const date = time.slice(0, 10);
  const clock = time.slice(11, 19);
  return `${date} ${clock}`;
};

export const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
};
