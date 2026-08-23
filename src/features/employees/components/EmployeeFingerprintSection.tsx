import { Fingerprint, Loader2, Upload, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Select } from "@/shared/components";
import type { EmployeeAddForm } from "../types";
import { labelCls } from "../styles";

type EmployeeFingerprintSectionProps = {
  gender: EmployeeAddForm["gender"];
  nextEmployeeId: number | null;
  loadingNextId: boolean;
  facePhotoPreview: string | null;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
};

const EmployeeFingerprintSection = ({
  gender,
  nextEmployeeId,
  loadingNextId,
  facePhotoPreview,
  onFormChange,
  onFacePhotoChange,
  onClearFacePhoto,
}: EmployeeFingerprintSectionProps) => {
  const handleGenderChange = (value: string): void => {
    onFormChange({ gender: value as "male" | "female" });
  };

  const handleFacePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onFacePhotoChange(file);
    e.target.value = "";
  };

  return (
  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
    <p className="text-xs text-primary mb-3 flex items-center gap-1.5">
      <Fingerprint className="w-3.5 h-3.5" />{" "}
      {arabicSource("employees.fingerprint_device_data_mandatory")}
    </p>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelCls} style={{ fontSize: 12 }}>
          {arabicSource("employees.employee_number")}
        </label>
        <div
          className="w-full h-11 px-4 rounded-lg border border-border bg-muted/30 text-foreground flex items-center font-mono"
          dir="ltr"
        >
          {loadingNextId ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : nextEmployeeId ? (
            `#${nextEmployeeId}`
          ) : (
            "—"
          )}
          <span className="text-muted-foreground text-[10px] ms-2">
            {arabicSource("employees.automatic")}
          </span>
        </div>
      </div>
      <Select
        label={arabicSource("employees.gender")}
        value={gender}
        onChange={handleGenderChange}
        options={[
          { value: "male", label: arabicSource("common.male") },
          { value: "female", label: arabicSource("common.female") },
        ]}
      />
    </div>
    <div className="mt-3">
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
    </div>
  </div>
  );
};

export default EmployeeFingerprintSection;
