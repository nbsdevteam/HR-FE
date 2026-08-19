import { memo } from "react";
import type { CSSProperties } from "react";
import type { DeviceEvent } from "../types";
import { formatDeviceEventTime } from "../utils/deviceManagement";

type DeviceEventsTableRowProps = {
  event: DeviceEvent;
  style?: CSSProperties;
};

const DeviceEventsTableRow = ({ event, style }: DeviceEventsTableRowProps) => (
  <tr style={style} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
    <td className="px-4 py-2 text-foreground font-mono text-sm" dir="ltr">{event.employeeNo}</td>
    <td className="px-4 py-2 text-foreground text-sm">{event.name || "—"}</td>
    <td className="px-4 py-2 text-foreground text-sm font-mono" dir="ltr">{formatDeviceEventTime(event.time)}</td>
    <td className="px-4 py-2 text-sm">
      <span className="text-muted-foreground">{event.verifyMode || "—"}</span>
    </td>
    <td className="px-4 py-2 text-sm text-muted-foreground font-mono" dir="ltr">{event.cardNo || "—"}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground">{event.doorNo || 1}</td>
  </tr>
);

export default memo(DeviceEventsTableRow);
