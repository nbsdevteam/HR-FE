import { Activity, Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { DeviceEvent } from "../types";
import { formatDeviceEventTime } from "../utils/deviceManagement";

type DeviceEventsTableProps = {
  events: DeviceEvent[];
  loading: boolean;
};

export const DeviceEventsTable = ({ events, loading }: DeviceEventsTableProps) => (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 overflow-hidden">
    <div className="max-h-[500px] overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="bg-muted/20 border-b border-border/20">
            {[
              arabicSource("common.employee_number"),
              arabicSource("common.name"),
              arabicSource("common.time"),
              arabicSource("devicemanagement.verification_method"),
              arabicSource("devicemanagement.card_number"),
              arabicSource("devicemanagement.the_door"),
            ].map((heading) => (
              <th key={heading} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </td>
            </tr>
          ) : events.length > 0 ? events.map((event, index) => (
            <tr key={`${event.employeeNo}-${event.time}-${index}`} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
              <td className="px-4 py-2 text-foreground font-mono text-sm" dir="ltr">{event.employeeNo}</td>
              <td className="px-4 py-2 text-foreground text-sm">{event.name || "—"}</td>
              <td className="px-4 py-2 text-foreground text-sm font-mono" dir="ltr">{formatDeviceEventTime(event.time)}</td>
              <td className="px-4 py-2 text-sm">
                <span className="text-muted-foreground">{event.verifyMode || "—"}</span>
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground font-mono" dir="ltr">{event.cardNo || "—"}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{event.doorNo || 1}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={Activity}
                  message={arabicSource("devicemanagement.there_are_no_events")}
                  hint={arabicSource("devicemanagement.click_search_to_view_the_events")}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
