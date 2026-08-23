import { memo } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  Printer,
  X,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, ModalOverlay } from "@/shared/components";
import type { DbReportTemplate } from "@/shared/hooks";
import type { ReportRow } from "../types";
import ReportResultsTable from "./ReportResultsTable";

type ReportViewerModalProps = {
  template: DbReportTemplate;
  generating: boolean;
  generatedData: ReportRow[] | null;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
  onGenerate: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
};

const ReportViewerModal = ({
  template,
  generating,
  generatedData,
  filterDept,
  dateFrom,
  dateTo,
  onClose,
  onGenerate,
  onExportCSV,
  onPrint,
}: ReportViewerModalProps) => (
  <ModalOverlay
    onClose={onClose}
    overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    contentClassName="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
    contentMotionProps={{
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    }}
  >
    <div className="p-6 border-b border-border/40 flex items-center justify-between">
      <div>
        <h2 className="text-lg text-foreground">{template.name_ar}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {template.description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!generatedData ? (
          <Button
            variant="primary"
            icon={BarChart3}
            loading={generating}
            onClick={onGenerate}
            className="shadow cursor-pointer"
          >
            {generating
              ? arabicSource("reports.construction_underway")
              : arabicSource("common.create")}
          </Button>
        ) : (
          <>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {arabicSource("reports.csv_export")}
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {arabicSource("common.print")}
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-auto p-6">
      {generating ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            {arabicSource("reports.collecting_report_data")}
          </p>
        </div>
      ) : !generatedData ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">
            {arabicSource("reports.click_generate_to_generate_the_report")}
          </p>
          <p className="text-muted-foreground/60 text-xs">
            {arabicSource(
              "reports.the_filters_specified_above_department_date_will_be_used",
            )}
          </p>
        </div>
      ) : generatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {arabicSource(
              "reports.there_is_no_matching_data_for_the_specified_filters",
            )}
          </p>
        </div>
      ) : (
        <ReportResultsTable
          data={generatedData}
          template={template}
          filterDept={filterDept}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </div>
  </ModalOverlay>
);

export default memo(ReportViewerModal);
