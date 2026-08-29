import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type PublicLeaveAttachmentFieldProps = {
  acceptedFormats: string[];
  file: File | null;
  maxMb: number;
  required: boolean;
  onAcceptFile: (file: File | null, acceptedFormats: string[], maxBytes: number) => void;
};

const PublicLeaveAttachmentField = ({
  acceptedFormats,
  file,
  maxMb,
  required,
  onAcceptFile,
}: PublicLeaveAttachmentFieldProps) => {
  const [dragging, setDragging] = useState(false);
  const maxBytes = maxMb * 1024 * 1024;

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (): void => {
    setDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    onAcceptFile(event.dataTransfer.files?.[0] || null, acceptedFormats, maxBytes);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onAcceptFile(event.target.files?.[0] || null, acceptedFormats, maxBytes);
  };

  const handleRemoveFileClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onAcceptFile(null, acceptedFormats, maxBytes);
  };

  return (
    <div>
      <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
        {arabicSource("public_leave.attachment_label")}{required && <span className="text-destructive"> *</span>}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{file.name}</span>
            <button
              type="button"
              onClick={handleRemoveFileClick}
              aria-label={arabicSource("public_leave.remove_attachment")}
              className="p-1 rounded-md hover:bg-destructive/10 text-destructive cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("public_leave.attachment_hint")}</div>
            <div className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
              {acceptedFormats.join(", ")} — {maxMb} MB
            </div>
            <input type="file" accept={acceptedFormats.join(",")} className="hidden" onChange={handleFileInputChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default PublicLeaveAttachmentField;
