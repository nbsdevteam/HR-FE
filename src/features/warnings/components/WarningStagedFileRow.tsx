import { useCallback } from "react";
import { FileText, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type TWarningStagedFileRowProps = {
  file: File;
  onRemove: (name: string) => void;
};

/** One file staged on the create form, not yet sent to the backend. */
const WarningStagedFileRow = ({ file, onRemove }: TWarningStagedFileRowProps) => {
  const handleRemoveClick = useCallback((): void => {
    onRemove(file.name);
  }, [file.name, onRemove]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/10">
      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-foreground flex-1 truncate" style={{ fontSize: 13 }}>
        {file.name}
      </span>
      <button
        type="button"
        onClick={handleRemoveClick}
        title={arabicSource("common.delete")}
        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WarningStagedFileRow;
