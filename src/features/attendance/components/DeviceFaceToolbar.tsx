import { RefreshCw } from "lucide-react";
import { SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type DeviceFaceToolbarProps = {
  search: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
};

const DeviceFaceToolbar = ({ search, loading, onSearchChange, onRefresh }: DeviceFaceToolbarProps) => (
  <div className="flex items-center gap-3">
    <SearchInput
      wrapperClassName="relative flex-1 min-w-[200px]"
      inputClassName="w-full ps-10 pe-4 py-2 rounded-lg bg-card/30 backdrop-blur-md border border-border/20 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50"
      value={search}
      onChange={onSearchChange}
      placeholder={arabicSource("common.search")}
    />
    <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
      <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
    </button>
  </div>
);

export default DeviceFaceToolbar;
