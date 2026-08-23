import { ScanFace, Trash2, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import type { DeviceFacePreview } from "../types";

type DeviceFaceModalProps = {
  face: DeviceFacePreview;
  onClose: () => void;
  onDelete: (employeeNumber: string) => void;
};

const DeviceFaceModal = ({ face, onClose, onDelete }: DeviceFaceModalProps) => {
  const handleDeleteClick = (_event: React.MouseEvent<HTMLButtonElement>): void => {
    onDelete(face.empNo);
  };

  return (
  <ModalOverlay
    onClose={onClose}
    overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
    contentClassName="bg-card/30 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 border border-border/30"
    contentMotionProps={{
      initial: { scale: 0.9 },
      animate: { scale: 1 },
      exit: { scale: 0.9 },
    }}
  >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-foreground">{arabicSource("devicemanagement.face_image")}{face.empNo}</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/20">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {face.image ? (
        <img
          src={`data:image/jpeg;base64,${face.image}`}
          alt={arabicSource("common.face_image")}
          className="w-full rounded-lg"
        />
      ) : (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <ScanFace className="w-16 h-16 mb-2 opacity-30" />
          <span>{arabicSource("devicemanagement.no_face_image_registered")}</span>
        </div>
      )}
      {face.image && (
        <button
          onClick={handleDeleteClick}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {arabicSource("devicemanagement.delete_the_image")}
        </button>
      )}
  </ModalOverlay>
  );
};

export default DeviceFaceModal;
