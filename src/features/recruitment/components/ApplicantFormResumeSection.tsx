import { memo, type RefObject } from "react";
import { AlertCircle, FileCheck, FileText, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";

type ApplicantFormResumeSectionProps = {
  resumeUrl: string;
  notes: string;
  uploading: boolean;
  uploadError: string;
  fileRef: RefObject<HTMLInputElement>;
  onFileSelected: (file: File) => void;
  onFieldChange: (field: string, value: string) => void;
};

const ApplicantFormResumeSection = ({
  resumeUrl, notes, uploading, uploadError, fileRef, onFileSelected, onFieldChange,
}: ApplicantFormResumeSectionProps) => (
  <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
    <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
      <FileText className="w-4 h-4" /> {arabicSource("recruitment.biography_and_notes")}
    </legend>
    <div>
      <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.curriculum_vitae_cv")}</label>
      <div
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${resumeUrl ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
      >
        {resumeUrl ? (
          <>
            <FileCheck className="w-8 h-8 text-emerald-400" />
            <span className="text-emerald-400" style={{ fontSize: 13 }}>{arabicSource("recruitment.the_file_was_uploaded_successfully")}</span>
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("recruitment.click_to_change_the_file")}</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-primary/60" />
            <span className="text-foreground" style={{ fontSize: 13 }}>
              {uploading ? arabicSource("recruitment.uploading") : arabicSource("recruitment.click_to_upload_your_cv_file")}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("recruitment.pdf_doc_docx_max_5mb")}</span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); }} />
      {uploadError && (
        <p className="text-destructive mt-2 flex items-center gap-1" style={{ fontSize: 12 }}>
          <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
        </p>
      )}
    </div>
    <div>
      <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.notes")}</label>
      <textarea value={notes} onChange={e => onFieldChange("notes", e.target.value)}
        rows={4} placeholder={arabicSource("recruitment.additional_notes_about_the_candidate")} className={`${inputCls} h-auto py-3 resize-none`} />
    </div>
  </fieldset>
);

export default memo(ApplicantFormResumeSection);
