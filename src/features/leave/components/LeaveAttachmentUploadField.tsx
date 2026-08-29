import { useRef } from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type LeaveAttachmentUploadFieldProps = {
  uploading: boolean;
  error: string;
  acceptedFormats: string[];
  onFileSelected: (file: File) => void;
};

/** Upload-onto-an-existing-leave field for `LeaveAttachmentsModal` — immediate upload, not staged for a form submit. */
const LeaveAttachmentUploadField = ({ uploading, error, acceptedFormats, onFileSelected }: LeaveAttachmentUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoneClick = (): void => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
    e.target.value = "";
  };

  return (
    <div>
      <div
        onClick={handleZoneClick}
        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors ${
          uploading ? "border-border cursor-wait opacity-70" : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
        }`}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-primary/60" />}
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          {uploading ? arabicSource("recruitment.uploading") : arabicSource("leave.attach_file")}
        </span>
      </div>
      <input ref={fileInputRef} type="file" accept={acceptedFormats.join(",")} className="hidden" onChange={handleFileInputChange} />
      {error && (
        <p className="text-destructive mt-1 flex items-center gap-1" style={{ fontSize: 12 }}>
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default LeaveAttachmentUploadField;
