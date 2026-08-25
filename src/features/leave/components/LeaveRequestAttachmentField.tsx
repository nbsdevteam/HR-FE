import { useRef } from "react";
import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type LeaveRequestAttachmentFieldProps = {
  requiresAttachment: boolean;
  attachmentFile: File | null;
  attachmentError: string;
  acceptedFormats: string[];
  maxBytes: number;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
};

const formatMb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(0);

/** Leave-attachment upload field: hidden file input + styled dropzone, mirrors the recruitment CV uploader. */
const LeaveRequestAttachmentField = ({
  requiresAttachment,
  attachmentFile,
  attachmentError,
  acceptedFormats,
  maxBytes,
  onFileSelected,
  onRemove,
}: LeaveRequestAttachmentFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoneClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
  };

  return (
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
        {arabicSource("leave.attach_file")} {requiresAttachment && "*"}
      </label>
      <div
        onClick={handleZoneClick}
        className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          attachmentFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        {attachmentFile ? (
          <>
            <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-foreground flex-1 truncate" style={{ fontSize: 13 }}>{attachmentFile.name}</span>
            <button onClick={onRemove} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-primary/60 flex-shrink-0" />
            <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("leave.attach_file")}</span>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept={acceptedFormats.join(",")} className="hidden" onChange={handleFileInputChange} />
      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
        {arabicSource("leave.accepted_formats")}: {acceptedFormats.join(", ")} — {arabicSource("leave.max_file_size")}: {formatMb(maxBytes)}MB
      </p>
      {attachmentError && (
        <p className="text-destructive mt-1 flex items-center gap-1" style={{ fontSize: 12 }}>
          <AlertCircle className="w-3.5 h-3.5" /> {attachmentError}
        </p>
      )}
    </div>
  );
};

export default LeaveRequestAttachmentField;
