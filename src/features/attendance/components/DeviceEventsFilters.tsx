import { Loader2, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type DeviceEventsFiltersProps = {
  startDate: string;
  endDate: string;
  searchEmp: string;
  loading: boolean;
  eventCount: number;
  error: string | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearchEmpChange: (employeeNumber: string) => void;
  onSearch: () => void;
};

const DeviceEventsFilters = ({
  startDate,
  endDate,
  searchEmp,
  loading,
  eventCount,
  error,
  onStartDateChange,
  onEndDateChange,
  onSearchEmpChange,
  onSearch,
}: DeviceEventsFiltersProps) => (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-4">
    <div className="flex items-end gap-4 flex-wrap">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("common.from_date")}</label>
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("devicemanagement.to_date")}</label>
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("common.employee_number")}</label>
        <input
          type="text"
          value={searchEmp}
          onChange={(event) => onSearchEmpChange(event.target.value)}
          placeholder={arabicSource("common.all")}
          className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm w-32"
          dir="ltr"
        />
      </div>
      <button
        onClick={onSearch}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {arabicSource("devicemanagement.search")}
      </button>
      <span className="text-xs text-muted-foreground">{eventCount} {arabicSource("devicemanagement.event")}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-3">
      Showing attendance history from HR database (imported + device sync), not the device live buffer.
    </p>
    {error && <p className="text-xs text-destructive mt-2">{error}</p>}
  </div>
);

export default DeviceEventsFilters;
