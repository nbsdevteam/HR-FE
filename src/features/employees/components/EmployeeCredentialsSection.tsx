import { Fingerprint } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm } from "../types";
import EmployeeCardNumberField from "./EmployeeCardNumberField";
import EmployeeFingerprintToggle from "./EmployeeFingerprintToggle";
import EmployeePhotoPicker from "./EmployeePhotoPicker";

type EmployeeCredentialsSectionProps = {
  addForm: EmployeeAddForm;
  facePhotoPreview: string | null;
  photoError?: string | null;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
};

const EmployeeCredentialsSection = ({
  addForm,
  facePhotoPreview,
  photoError = null,
  onFormChange,
  onFacePhotoChange,
  onClearFacePhoto,
}: EmployeeCredentialsSectionProps) => {
  const handleFingerprintToggle = (checked: boolean): void => {
    onFormChange({ enrollFingerprint: checked });
  };

  return (
    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
      <p className="text-xs text-primary flex items-center gap-1.5">
        <Fingerprint className="w-3.5 h-3.5" />{" "}
        {arabicSource("employees.step_2_all_optional_intro")}
      </p>
      <EmployeePhotoPicker
        facePhotoPreview={facePhotoPreview}
        photoError={photoError}
        onFacePhotoChange={onFacePhotoChange}
        onClearFacePhoto={onClearFacePhoto}
      />
      <EmployeeCardNumberField value={addForm.cardNumber} onFormChange={onFormChange} />
      <EmployeeFingerprintToggle checked={addForm.enrollFingerprint} onChange={handleFingerprintToggle} />
    </div>
  );
};

export default EmployeeCredentialsSection;
