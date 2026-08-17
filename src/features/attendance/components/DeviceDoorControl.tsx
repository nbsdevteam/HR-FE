import { DoorClosed, DoorOpen, Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type DeviceDoorControlProps = {
  loading: boolean;
  onDoorAction: (action: "open" | "close") => void;
};

const DeviceDoorControl = ({ loading, onDoorAction }: DeviceDoorControlProps) => (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-6">
    <h3 className="text-foreground mb-4 flex items-center gap-2">
      <Shield className="w-5 h-5 text-primary" />
      {arabicSource("devicemanagement.door_control")}
    </h3>
    <div className="flex gap-3">
      <button
        onClick={() => onDoorAction("open")}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
      >
        <DoorOpen className="w-4 h-4" />
        {arabicSource("devicemanagement.the_door_opened")}
      </button>
      <button
        onClick={() => onDoorAction("close")}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
      >
        <DoorClosed className="w-4 h-4" />
        {arabicSource("devicemanagement.close_the_door")}
      </button>
    </div>
  </div>
);

export default DeviceDoorControl;
