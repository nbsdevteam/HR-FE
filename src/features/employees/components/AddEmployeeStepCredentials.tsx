import type { DeviceEnrollment, EmployeeAddForm } from "../types";
import EmployeeCredentialsSection from "./EmployeeCredentialsSection";
import EmployeeDeviceEnrollmentBanner from "./EmployeeDeviceEnrollmentBanner";

type AddEmployeeStepCredentialsProps = {
  addForm: EmployeeAddForm;
  facePhotoPreview: string | null;
  photoError: string | null;
  deviceEnrollment: DeviceEnrollment | null;
  syncing: boolean;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
};

const AddEmployeeStepCredentials = ({
  addForm,
  facePhotoPreview,
  photoError,
  deviceEnrollment,
  syncing,
  onFormChange,
  onFacePhotoChange,
  onClearFacePhoto,
}: AddEmployeeStepCredentialsProps) => (
  <div className="space-y-3">
    <EmployeeCredentialsSection
      addForm={addForm}
      facePhotoPreview={facePhotoPreview}
      photoError={photoError}
      onFormChange={onFormChange}
      onFacePhotoChange={onFacePhotoChange}
      onClearFacePhoto={onClearFacePhoto}
    />
    <EmployeeDeviceEnrollmentBanner enrollment={deviceEnrollment} syncing={syncing} />
  </div>
);

export default AddEmployeeStepCredentials;
