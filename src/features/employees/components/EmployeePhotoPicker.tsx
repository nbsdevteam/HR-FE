import { Upload, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { labelCls } from "../styles";

type EmployeePhotoPickerProps = {
  facePhotoPreview: string | null;
  photoError?: string | null;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
};

const EmployeePhotoPicker = ({
  facePhotoPreview,
  photoError = null,
  onFacePhotoChange,
  onClearFacePhoto,
}: EmployeePhotoPickerProps) => {
  const handleFacePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onFacePhotoChange(file);
    e.target.value = "";
  };

  return (
    <div>
      <label className={labelCls} style={{ fontSize: 12 }}>
        {arabicSource("common.face_image")}{" "}
        <span className="text-muted-foreground">
          {arabicSource("employees.optional_can_be_added_later")}
        </span>
      </label>
      <div className="flex items-center gap-3">
        {facePhotoPreview ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-primary/30">
            <img
              src={facePhotoPreview}
              alt={arabicSource("common.face_image")}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClearFacePhoto}
              className="absolute top-0 end-0 p-0.5 bg-black/60 rounded-bl text-white hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {arabicSource("employees.upload_an_image")}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFacePhotoInputChange}
            />
          </label>
        )}
        <span className="text-[10px] text-muted-foreground/60">
          {arabicSource("employees.jpg_or_png_max_200kb")}
        </span>
      </div>
      {photoError && (
        <p className="text-destructive mt-1.5" style={{ fontSize: 12 }}>{photoError}</p>
      )}
    </div>
  );
};

export default EmployeePhotoPicker;
