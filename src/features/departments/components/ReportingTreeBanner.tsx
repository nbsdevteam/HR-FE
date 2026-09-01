import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Shown while `reporting_tree_is_flat` — missing configuration, not an
 * error, so this stays neutral rather than using an error/warning style
 * (task doc §6).
 */
const ReportingTreeBanner = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-muted-foreground">
      <Info className="w-4 h-4 shrink-0" />
      <p style={{ fontSize: 12.5 }}>{t("hierarchy.reporting_tree_flat_banner")}</p>
    </div>
  );
};

export default ReportingTreeBanner;
