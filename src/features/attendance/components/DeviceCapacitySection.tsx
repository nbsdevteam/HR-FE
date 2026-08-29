import { Activity, CreditCard, Fingerprint, ScanFace, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DeviceCapacity } from "../types";
import DeviceCapacityBar from "./DeviceCapacityBar";

const DeviceCapacitySection = ({ capacity }: { capacity: DeviceCapacity }) => (
  <div>
    <h3 className="text-foreground mb-3 flex items-center gap-2">
      <Activity className="w-5 h-5 text-primary" />
      {arabicSource("devicemanagement.device_capacity")}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <DeviceCapacityBar label={arabicSource("devicemanagement.people")} icon={Users} used={capacity.person.used} total={capacity.person.total} color="text-blue-400" />
      <DeviceCapacityBar label={arabicSource("devicemanagement.faces")} icon={ScanFace} used={capacity.face.used} total={capacity.face.total} color="text-emerald-400" />
      <DeviceCapacityBar label={arabicSource("devicemanagement.fingerprints")} icon={Fingerprint} used={capacity.fingerprint.used} total={capacity.fingerprint.total} color="text-purple-400" />
      <DeviceCapacityBar label={arabicSource("devicemanagement.cards")} icon={CreditCard} used={capacity.card.used} total={capacity.card.total} color="text-amber-400" />
      <DeviceCapacityBar label={arabicSource("devicemanagement.events")} icon={Activity} used={capacity.event.used} total={capacity.event.total} color="text-red-400" />
    </div>
  </div>
);

export default DeviceCapacitySection;
