import { useCallback, useRef } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import WarningStagedFileRow from "./WarningStagedFileRow";

type TWarningAttachmentFieldProps = {
  files: File[];
  error: string;
  acceptedFormats: string[];
  maxBytes: number;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (name: string) => void;
};

const formatMb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(0);

/**
 * Optional attachment picker for the create-warning form. `accept` and the size
 * check both come from `/warnings/attachment_settings`, since HR can change
 * either from the settings screen (backend §2).
 */
const WarningAttachmentField = ({
  files,
  error,
  acceptedFormats,
  maxBytes,
  onFilesSelected,
  onRemoveFile,
}: TWarningAttachmentFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoneClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.length) onFilesSelected(Array.from(e.target.files));
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
  }, [onFilesSelected]);

  return (
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
        {arabicSource("warnings.attachments_optional")}
      </label>

      {files.length > 0 && (
        <div className="space-y-2 mb-2">
          {files.map((file) => (
            <WarningStagedFileRow key={file.name} file={file} onRemove={onRemoveFile} />
          ))}
        </div>
      )}

      <div
        onClick={handleZoneClick}
        className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <Upload className="w-5 h-5 text-primary/60 flex-shrink-0" />
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          {arabicSource("leave.attach_file")}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(",")}
        className="hidden"
        onChange={handleFileInputChange}
      />

      <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
        {arabicSource("leave.accepted_formats")}: {acceptedFormats.join(", ")} —{" "}
        {arabicSource("leave.max_file_size")}: {formatMb(maxBytes)}MB
      </p>

      {error && (
        <p className="text-destructive mt-1 flex items-center gap-1" style={{ fontSize: 12 }}>
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default WarningAttachmentField;
