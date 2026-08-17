import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

const PublicApplyLoadingState = () => (
  <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
    <span style={{ fontSize: 14 }}>{arabicSource("apply.loading")}</span>
  </div>
);

export default PublicApplyLoadingState;
