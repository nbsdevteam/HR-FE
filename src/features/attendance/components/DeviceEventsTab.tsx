import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { DeviceEvent } from "../types";
import DeviceEventsFilters from "./DeviceEventsFilters";
import DeviceEventsTable from "./DeviceEventsTable";

type EventFilters = {
  startDate: string;
  endDate: string;
  employeeNo: string;
};

const today = (): string => new Date().toISOString().slice(0, 10);

/** Preferred source: the device punch ledger. Returns [] when unavailable. */
const fetchLedgerEvents = async ({
  startDate,
  endDate,
  employeeNo,
}: EventFilters): Promise<DeviceEvent[]> => {
  try {
    const ledger = await odooData.fetchDeviceEvents({
      dateFrom: startDate,
      dateTo: endDate,
      employeeNo: employeeNo || undefined,
      limit: 2000,
    });
    return (ledger || []).map((row: any) => ({
      employeeNo: String(row.employee_no || row.device_employee_no || "—"),
      name: row.employee_name || "—",
      time: String(row.event_time || "").replace(" ", "T"),
      verifyMode: String(
        row.verify_mode || (row.processed ? "processed" : "pending"),
      ),
      cardNo: String(row.card_no || ""),
      doorNo: Number(row.door_no) || 0,
    }));
  } catch {
    return [];
  }
};

/** Fallback: derive punches from the attendance table's check-in/out columns. */
const fetchAttendanceEvents = async ({
  startDate,
  endDate,
  employeeNo,
}: EventFilters): Promise<DeviceEvent[]> => {
  const rows = await odooData.fetchAttendance({
    date_from: startDate,
    date_to: endDate,
    limit: 5000,
  });
  const events: DeviceEvent[] = [];

  for (const row of rows) {
    const empNo = String(row.device_employee_no || "").trim();
    if (
      employeeNo &&
      empNo !== employeeNo &&
      !String(row.employee_id).includes(employeeNo)
    ) {
      continue;
    }

    const name = row.employee_name || "—";
    const verify =
      row.verify_mode ||
      (row.source === "device" ? "device" : row.source || "—");

    if (row.check_in_time) {
      events.push({
        employeeNo: empNo || "—",
        name,
        time: `${row.date}T${row.check_in_time}`,
        verifyMode: String(verify),
        cardNo: "",
        doorNo: 1,
      });
    }
    if (row.check_out_time) {
      events.push({
        employeeNo: empNo || "—",
        name,
        time: `${row.date}T${row.check_out_time}`,
        verifyMode: String(verify),
        cardNo: "",
        doorNo: 1,
      });
    }
  }

  return events;
};

const DeviceEventsTab = () => {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [searchEmp, setSearchEmp] = useState("");

  const fetchEvents = useCallback(async (): Promise<DeviceEvent[]> => {
    const filters: EventFilters = {
      startDate,
      endDate,
      employeeNo: searchEmp.trim(),
    };

    let events = await fetchLedgerEvents(filters);
    if (events.length === 0) events = await fetchAttendanceEvents(filters);

    return events.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  }, [startDate, endDate, searchEmp]);

  // Empty deps: the filters are applied on demand via the Search button, not on
  // every keystroke. `useAsyncList` always calls the latest fetcher.
  const {
    data: events,
    loading,
    error,
    refetch: load,
  } = useAsyncList<DeviceEvent>(
    fetchEvents,
    [],
    "Failed to load punch ledger",
  );

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
  }, []);

  const handleSearchEmpChange = useCallback((employeeNumber: string) => {
    setSearchEmp(employeeNumber);
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

export default DeviceEventsTab;
