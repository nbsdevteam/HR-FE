import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

const HydrateFallback = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <span className="text-muted-foreground ms-3">{arabicSource("common.loading")}</span>
    </div>
  );
};

export default HydrateFallback;
