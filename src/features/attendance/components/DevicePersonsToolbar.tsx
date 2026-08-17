import { Loader2, RefreshCw, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type DevicePersonsToolbarProps = {
  search: string;
  loading: boolean;
  loadingFaces: boolean;
  totalPeople: number;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
};

const DevicePersonsToolbar = ({
  search,
  loading,
  loadingFaces,
  totalPeople,
  onSearchChange,
  onRefresh,
}: DevicePersonsToolbarProps) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={arabicSource("devicemanagement.search_by_name_or_employee_number")}
        className="w-full ps-10 pe-4 py-2 rounded-lg bg-card/30 backdrop-blur-md border border-border/20 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50"
      />
    </div>
    <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-muted/20 transition-colors" title={arabicSource("common.update")}>
      <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
    </button>
    <span className="text-xs text-muted-foreground">{totalPeople} {arabicSource("devicemanagement.registered_person")}</span>
    {loadingFaces && (
      <span className="text-xs text-blue-400 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {arabicSource("devicemanagement.loading_images")}
      </span>
    )}
    <span className="text-[10px] text-muted-foreground/50 border border-border/20 rounded px-2 py-1">
      {arabicSource("devicemanagement.to_add_a_new_employee_use_the_employees_page")}
    </span>
  </div>
);

export default DevicePersonsToolbar;
