import type { DbReportTemplate } from "@/shared/hooks";
import ReportTemplateCard from "./ReportTemplateCard";

type ReportTemplatesGridProps = {
  templates: DbReportTemplate[];
  onSelect: (template: DbReportTemplate) => void;
};

const ReportTemplatesGrid = ({ templates, onSelect }: ReportTemplatesGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {templates.map((template, i) => (
      <ReportTemplateCard key={template.id} template={template} index={i} onSelect={onSelect} />
    ))}
  </div>
);

export default ReportTemplatesGrid;
