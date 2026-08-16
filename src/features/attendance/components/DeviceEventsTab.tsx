import { useCallback, useEffect, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DeviceEvent } from "../types";
import { DeviceEventsFilters } from "./DeviceEventsFilters";
import { DeviceEventsTable } from "./DeviceEventsTable";

export const DeviceEventsTab = () => {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchEmp, setSearchEmp] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const empFilter = searchEmp.trim();
      let mapped: DeviceEvent[] = [];

      try {
        const ledger = await odooData.fetchDeviceEvents({
          dateFrom: startDate,
          dateTo: endDate,
          employeeNo: empFilter || undefined,
          limit: 2000,
        });
        mapped = (ledger || []).map((row: any) => ({
          employeeNo: String(row.employee_no || row.device_employee_no || "—"),
          name: row.employee_name || "—",
          time: String(row.event_time || "").replace(" ", "T"),
          verifyMode: String(row.verify_mode || (row.processed ? "processed" : "pending")),
          cardNo: String(row.card_no || ""),
          doorNo: Number(row.door_no) || 0,
        }));
      } catch {
        mapped = [];
      }

      if (mapped.length === 0) {
        const rows = await odooData.fetchAttendance({
          date_from: startDate,
          date_to: endDate,
          limit: 5000,
        });

        for (const row of rows) {
          const empNo = String(row.device_employee_no || "").trim();
          if (empFilter && empNo !== empFilter && !String(row.employee_id).includes(empFilter)) {
            continue;
          }

          const name = row.employee_name || "—";
          const verify = row.verify_mode || (row.source === "device" ? "device" : row.source || "—");
          if (row.check_in_time) {
            mapped.push({
              employeeNo: empNo || "—",
              name,
              time: `${row.date}T${row.check_in_time}`,
              verifyMode: String(verify),
              cardNo: "",
              doorNo: 1,
            });
          }
          if (row.check_out_time) {
            mapped.push({
              employeeNo: empNo || "—",
              name,
              time: `${row.date}T${row.check_out_time}`,
              verifyMode: String(verify),
              cardNo: "",
              doorNo: 1,
            });
          }
        }
      }

      mapped.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
      setEvents(mapped);
    } catch (err: any) {
      setEvents([]);
      setError(err?.message || "Failed to load punch ledger");
    }
    setLoading(false);
  }, [startDate, endDate, searchEmp]);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
  }, []);

  const handleSearchEmpChange = useCallback((employeeNumber: string) => {
    setSearchEmp(employeeNumber);
  }, []);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <DeviceEventsFilters
        startDate={startDate}
        endDate={endDate}
        searchEmp={searchEmp}
        loading={loading}
        eventCount={events.length}
        error={error}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onSearchEmpChange={handleSearchEmpChange}
        onSearch={load}
      />
      <DeviceEventsTable events={events} loading={loading} />
    </div>
  );
};
