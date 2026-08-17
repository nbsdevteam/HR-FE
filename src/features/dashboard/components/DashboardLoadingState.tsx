import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

const DashboardLoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
    <span className="text-muted-foreground ms-3">{arabicSource("dashboard.loading_control_panel")}</span>
  </div>
);

export default DashboardLoadingState;
