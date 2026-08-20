import { FileText } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate } from "@/shared/hooks";
import { categoryIcons, categoryLabels } from "../constants/reports";

type ReportTemplateRowProps = {
  template: DbReportTemplate;
  onSelect: (template: DbReportTemplate) => void;
};

const ReportTemplateRow = ({ template, onSelect }: ReportTemplateRowProps) => {
  const Icon = categoryIcons[template.category] || FileText;
  return (
    <tr className="border-b border-border/20 hover:bg-muted/10">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-foreground">{template.name_ar}</span>
        </div>
      </td>
      <td className="p-3">
        <span
          className="px-2 py-0.5 rounded-md bg-primary/10 text-primary"
          style={{ fontSize: 11 }}
        >
          {categoryLabels[template.category]}
        </span>
      </td>
      <td className="p-3 text-muted-foreground">{template.columns.length}</td>
      <td className="p-3 text-muted-foreground">{template.format}</td>
      <td className="p-3">
        <button
          onClick={() => onSelect(template)}
          className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer text-xs"
        >
          {arabicSource("common.create")}
        </button>
      </td>
    </tr>
  );
};

export default ReportTemplateRow;
