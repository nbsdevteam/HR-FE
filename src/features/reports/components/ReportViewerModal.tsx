import { memo } from "react";
import {
  AlertTriangle,
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
import { isBackendReportCode } from "../constants/reports";
import type { ReportColumn, ReportField, ReportRow } from "../types";
import ReportFieldPicker from "./ReportFieldPicker";
import ReportResultsTable from "./ReportResultsTable";

type ReportViewerModalProps = {
  template: DbReportTemplate;
  generating: boolean;
  generateError: string | null;
  generatedData: ReportRow[] | null;
  generatedColumns: ReportColumn[] | null;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
  fields: ReportField[];
  selectedFieldKeys: string[];
  fieldsLoading: boolean;
  onToggleField: (key: string) => void;
  onSelectAllFields: () => void;
  onClearAllFields: () => void;
  onClose: () => void;
  onGenerate: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
};

const ReportViewerModal = ({
  template,
  generating,
  generateError,
  generatedData,
  generatedColumns,
  filterDept,
  dateFrom,
  dateTo,
  fields,
  selectedFieldKeys,
  fieldsLoading,
  onToggleField,
  onSelectAllFields,
  onClearAllFields,
  onClose,
  onGenerate,
  onExportCSV,
  onPrint,
}: ReportViewerModalProps) => {
  const requiresFieldSelection = isBackendReportCode(template.code);
  const canGenerate = !requiresFieldSelection || selectedFieldKeys.length > 0;

  return (
  <ModalOverlay
    onClose={onClose}
    overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    contentClassName="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-5xl min-w-0 max-h-[85vh] overflow-hidden flex flex-col"
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
            disabled={!canGenerate}
            onClick={onGenerate}
            className="shadow cursor-pointer"
          >
            {generating
              ? arabicSource("reports.construction_underway")
              : arabicSource("common.create")}
          </Button>
        ) : (
          <>
            <Button
              variant="success"
              size="unstyled"
              rounded="rounded-lg"
              icon={Download}
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30"
            >
              {arabicSource("reports.csv_export")}
            </Button>
            <Button
              variant="info"
              size="unstyled"
              rounded="rounded-lg"
              icon={Printer}
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 border border-blue-500/30"
            >
              {arabicSource("common.print")}
            </Button>
          </>
        )}
        <Button
          variant="unstyled"
          size="icon"
          rounded="rounded-lg"
          icon={X}
          iconClassName="w-5 h-5"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/20"
        />
      </div>
    </div>

    {generateError && (
      <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2" style={{ fontSize: 13 }}>
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span dir="auto">{generateError}</span>
      </div>
    )}

    <div className="flex-1 overflow-auto p-6">
      {requiresFieldSelection && (
        <ReportFieldPicker
          fields={fields}
          selected={selectedFieldKeys}
          onToggle={onToggleField}
          onSelectAll={onSelectAllFields}
          onClearAll={onClearAllFields}
          loading={fieldsLoading}
        />
      )}
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
          columns={generatedColumns ?? template.columns}
          filterDept={filterDept}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </div>
  </ModalOverlay>
  );
};

export default memo(ReportViewerModal);
