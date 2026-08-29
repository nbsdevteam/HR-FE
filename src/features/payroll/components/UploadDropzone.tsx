import type { ChangeEvent, RefObject } from "react";
import { useCallback } from "react";
import { CheckCircle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";

type UploadDropzoneProps = {
  fileInputRef: RefObject<HTMLInputElement>;
  uploading: boolean;
  hasResult: boolean;
  onFileSelected: (file: File) => void;
};

const UploadDropzone = ({ fileInputRef, uploading, hasResult, onFileSelected }: UploadDropzoneProps) => {
  const handleClick = useCallback(() => fileInputRef.current?.click(), [fileInputRef]);
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
  }, [onFileSelected]);

  return (
    <div className={`${cardCls} p-8`}>
      <div className="text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-foreground mb-2">{arabicSource("payroll.uploading_the_attendance_and_departure_file")}</h3>
        <p className="text-muted-foreground mb-6" style={{ fontSize: 13 }}>
          {arabicSource("payroll.upload_an_excel_or_csv_file_containing_the_columns_person_id_nam")}
        </p>

        <div
          onClick={handleClick}
          className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
            hasResult
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-foreground">{arabicSource("payroll.analyzing_the_file")}</span>
            </div>
          ) : hasResult ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span className="text-emerald-400">{arabicSource("payroll.the_file_was_successfully_parsed_click_to_upload_another_file")}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-primary/60" />
              <span className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("payroll.click_to_select_a_file_or_drag_it_here")}</span>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.excel_xlsx_xls_or_csv_max_10mb")}</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default UploadDropzone;
