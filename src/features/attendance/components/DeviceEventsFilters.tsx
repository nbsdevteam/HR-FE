import { Search } from "lucide-react";
import { Button } from "@/shared/components";
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
}: DeviceEventsFiltersProps) => {
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onStartDateChange(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onEndDateChange(event.target.value);
  };

  const handleSearchEmpChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchEmpChange(event.target.value);
  };

  return (
    <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-4">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("common.from_date")}</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("devicemanagement.to_date")}</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{arabicSource("common.employee_number")}</label>
          <input
            type="text"
            value={searchEmp}
            onChange={handleSearchEmpChange}
            placeholder={arabicSource("common.all")}
            className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm w-32"
            dir="ltr"
          />
        </div>
        <Button
          onClick={onSearch}
          disabled={loading}
          loading={loading}
          variant="unstyled"
          size="unstyled"
          rounded="rounded-lg"
          className="flex gap-2 px-4 py-2 text-sm bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          icon={Search}
        >
          {arabicSource("devicemanagement.search")}
        </Button>
        <span className="text-xs text-muted-foreground">{eventCount} {arabicSource("devicemanagement.event")}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Showing attendance history from HR database (imported + device sync), not the device live buffer.
      </p>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
};

export default DeviceEventsFilters;
