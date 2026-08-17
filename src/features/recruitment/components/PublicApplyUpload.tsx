import { FileText, Upload, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { acceptedResumeTypes } from "../constants/publicApply";

type PublicApplyUploadProps = {
  dragging: boolean;
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  maxResumeMb: number;
  onAcceptFile: (file: File | null) => void;
  onDraggingChange: (dragging: boolean) => void;
  onFileChange: (file: File | null) => void;
};

const PublicApplyUpload = ({
  dragging,
  file,
  fileInputRef,
  maxResumeMb,
  onAcceptFile,
  onDraggingChange,
  onFileChange,
}: PublicApplyUploadProps) => (
  <div
    onDragOver={(event) => {
      event.preventDefault();
      onDraggingChange(true);
    }}
    onDragLeave={() => onDraggingChange(false)}
    onDrop={(event) => {
      event.preventDefault();
      onDraggingChange(false);
      onAcceptFile(event.dataTransfer.files?.[0] || null);
    }}
    onClick={() => fileInputRef.current?.click()}
    className={`rounded-xl border-2 border-dashed px-5 py-8 text-center cursor-pointer transition-colors ${
      dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
    }`}
  >
    {file ? (
      <div className="flex items-center justify-center gap-3">
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{file.name}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFileChange(null);
          }}
          aria-label={arabicSource("apply.remove_file")}
          className="p-1 rounded-md hover:bg-destructive/10 text-destructive cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <>
        <Upload className="w-7 h-7 text-primary mx-auto mb-2" />
        <div className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("apply.cv_hint")}</div>
        <div className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
          {arabicSource("apply.cv_formats")} — {maxResumeMb} MB
        </div>
      </>
    )}
    <input
      ref={fileInputRef}
      type="file"
      accept={acceptedResumeTypes}
      className="hidden"
      onChange={(event) => onAcceptFile(event.target.files?.[0] || null)}
    />
  </div>
);

export default PublicApplyUpload;
