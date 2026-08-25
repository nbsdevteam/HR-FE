import { DoorClosed, DoorOpen, Shield } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type DeviceDoorControlProps = {
  loading: boolean;
  onDoorAction: (action: "open" | "close") => void;
};

const DeviceDoorControl = ({ loading, onDoorAction }: DeviceDoorControlProps) => {
  const handleOpenDoorClick = (_event: React.MouseEvent<HTMLButtonElement>): void => {
    onDoorAction("open");
  };

  const handleCloseDoorClick = (_event: React.MouseEvent<HTMLButtonElement>): void => {
    onDoorAction("close");
  };

  return (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-6">
    <h3 className="text-foreground mb-4 flex items-center gap-2">
      <Shield className="w-5 h-5 text-primary" />
      {arabicSource("devicemanagement.door_control")}
    </h3>
    <div className="flex gap-3">
      <Button
        onClick={handleOpenDoorClick}
        disabled={loading}
        variant="success"
        size="unstyled"
        rounded="rounded-lg"
        className="flex gap-2 px-4 py-2 border border-emerald-500/30"
        icon={DoorOpen}
      >
        {arabicSource("devicemanagement.the_door_opened")}
      </Button>
      <Button
        onClick={handleCloseDoorClick}
        disabled={loading}
        variant="unstyled"
        size="unstyled"
        rounded="rounded-lg"
        className="flex gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
        icon={DoorClosed}
      >
        {arabicSource("devicemanagement.close_the_door")}
      </Button>
    </div>
  </div>
  );
};

export default DeviceDoorControl;
