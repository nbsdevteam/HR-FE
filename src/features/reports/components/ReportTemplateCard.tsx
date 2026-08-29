import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Eye, FileText } from "lucide-react";
import StatusBadge from "@/shared/components/StatusBadge";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbReportTemplate } from "@/shared/hooks";
import { categoryIcons, categoryLabels } from "../constants/reports";

type ReportTemplateCardProps = {
  template: DbReportTemplate;
  index: number;
  onSelect: (template: DbReportTemplate) => void;
};

const ReportTemplateCard = ({
  template,
  index,
  onSelect,
}: ReportTemplateCardProps) => {
  const Icon = categoryIcons[template.category] || FileText;
  const { primary: templateName, secondary: templateNameSecondary } =
    useLocalizedName(template.name_ar, template.name_en);

  const handleSelectClick = useCallback((): void => {
    onSelect(template);
  }, [onSelect, template]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -5 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-foreground line-clamp-1"
            title={templateNameSecondary || undefined}
            data-i18n-ignore
          >
            {templateName}
          </h3>
          <p
            className="text-muted-foreground mt-1 line-clamp-2 min-h-[36px]"
            style={{ fontSize: 12 }}
            title={template?.description || undefined}
          >
            {template.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <StatusBadge
          colorClassName="bg-primary/10 border-primary/20 text-primary"
          fontSize={11}
        >
          {categoryLabels[template.category] || template.category}
        </StatusBadge>
        <span className="text-muted-foreground" style={{ fontSize: 11 }}>
          {template.columns.length} {arabicSource("common.column")}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSelectClick}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
      >
        <Eye className="w-4 h-4" />
        {arabicSource("reports.create_the_report")}
      </motion.button>
    </motion.div>
  );
};

export default memo(ReportTemplateCard);
