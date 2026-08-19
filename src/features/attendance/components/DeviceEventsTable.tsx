import { memo, useCallback, useMemo, useState } from "react";
import type { UIEvent } from "react";
import { Activity, Loader2 } from "lucide-react";
import { EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DeviceEvent } from "../types";
import { tableRowData } from "../data";
import DeviceEventsTableRow from "./DeviceEventsTableRow";

type DeviceEventsTableProps = {
  events: DeviceEvent[];
  loading: boolean;
};

const ROW_HEIGHT = 37;
const VIEWPORT_HEIGHT = 500;
const OVERSCAN = 8;

const DeviceEventsTable = ({ events, loading }: DeviceEventsTableProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    const visibleRowCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT);
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(events.length, start + visibleRowCount + OVERSCAN * 2);
    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: (events.length - end) * ROW_HEIGHT,
    };
  }, [scrollTop, events.length]);

  const visibleEvents = useMemo(() => events.slice(startIndex, endIndex), [events, startIndex, endIndex]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 overflow-hidden">
      <div className="max-h-[500px] overflow-y-auto" onScroll={handleScroll}>
        <table className="w-full">
          <thead className="sticky top-0 bg-card z-10">
            <TableHeaderRow headings={tableRowData} />
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : events.length > 0 ? (
              <>
                {topSpacerHeight > 0 && (
                  <tr>
                    <td colSpan={6} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
                  </tr>
                )}
                {visibleEvents.map((event, offset) => (
                  <DeviceEventsTableRow key={`${event.employeeNo}-${event.time}-${startIndex + offset}`} event={event} />
                ))}
                {bottomSpacerHeight > 0 && (
                  <tr>
                    <td colSpan={6} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
                  </tr>
                )}
              </>
            ) : (
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
};

export default memo(DeviceEventsTable);
