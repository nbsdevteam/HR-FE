import { Fingerprint, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay, TypeAhead } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import EmployeeDeviceSyncBanner from "./EmployeeDeviceSyncBanner";
import EmployeeFingerprintSection from "./EmployeeFingerprintSection";
import LabeledInput from "./LabeledInput";

const getDepartmentId = (d: DbDepartment): string => d.id;
const getDepartmentLabel = (d: DbDepartment): string => d.name;
const getDesignationId = (p: DbPosition): string => p.id;
const getDesignationLabel = (p: DbPosition): string =>
  p.title_ar || p.title_en || p.id;
const fieldLabelClass = "text-foreground block mb-1.5";

type AddEmployeeModalProps = {
  addForm: EmployeeAddForm;
  addSaving: boolean;
  addError: string | null;
  deviceSyncStatus: DeviceSyncStatus;
  nextEmployeeId: number | null;
  loadingNextId: boolean;
  facePhotoPreview: string | null;
  departmentOptions: DbDepartment[];
  designationOptions: DbPosition[];
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
  onAddEmployee: () => void;
  onClose: () => void;
};

const AddEmployeeModal = ({
  addForm,
  addSaving,
  addError,
  deviceSyncStatus,
  nextEmployeeId,
  loadingNextId,
  facePhotoPreview,
  departmentOptions,
  designationOptions,
  onFormChange,
  onFacePhotoChange,
  onClearFacePhoto,
  onAddEmployee,
  onClose,
}: AddEmployeeModalProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ name: e.target.value });
  };

  const handleNationalIdChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onFormChange({ nationalId: e.target.value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ email: e.target.value });
  };

  const handlePersonalPhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onFormChange({ personalPhone: e.target.value });
  };

  const handleCompanyPhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onFormChange({ companyPhone: e.target.value });
  };

  const handleDepartmentChange = (value: string): void => {
    onFormChange({
      departmentId: value,
      designationId: "",
    });
  };

  const handleDesignationChange = (value: string): void => {
    onFormChange({ designationId: value });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ salary: e.target.value });
  };

  const handleJoinDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onFormChange({ joinDate: e.target.value });
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onFormChange({ address: e.target.value });
  };

  const handleModalClose = (): void => {
    if (!addSaving) onClose();
  };

  return (
    <ModalOverlay
      onClose={handleModalClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
    >
      <ModalHeader
        title={arabicSource("common.add_a_new_employee")}
        onClose={handleModalClose}
        className="flex items-center justify-between mb-5"
      />
      <div className="space-y-4">
        <EmployeeFingerprintSection
          gender={addForm.gender}
          nextEmployeeId={nextEmployeeId}
          loadingNextId={loadingNextId}
          facePhotoPreview={facePhotoPreview}
          onFormChange={onFormChange}
          onFacePhotoChange={onFacePhotoChange}
          onClearFacePhoto={onClearFacePhoto}
        />

        <div className="border-t border-border/20 pt-3">
          <p className="text-xs text-muted-foreground mb-3">
            {arabicSource("employees.employee_data")}
          </p>
          <div className="mb-3">
            <LabeledInput
              label={arabicSource("common.full_name")}
              type="text"
              value={addForm.name}
              onChange={handleNameChange}
              placeholder={arabicSource("employees.enter_the_employee_s_name")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label={arabicSource("common.id_number")}
              type="text"
              value={addForm.nationalId}
              onChange={handleNationalIdChange}
              placeholder={arabicSource("employees.national_id_number")}
            />
            <LabeledInput
              label={arabicSource("common.email")}
              type="email"
              value={addForm.email}
              onChange={handleEmailChange}
              placeholder="example@company.iq"
            />
            <LabeledInput
              label={arabicSource("employees.personal_phone")}
              type="text"
              value={addForm.personalPhone}
              onChange={handlePersonalPhoneChange}
              placeholder="07XXXXXXXXX"
            />
            <LabeledInput
              label={arabicSource("common.company_phone")}
              type="text"
              value={addForm.companyPhone}
              onChange={handleCompanyPhoneChange}
              placeholder="07XXXXXXXXX"
            />
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 12 }}>
                {arabicSource("common.section")}
              </label>
              <TypeAhead
                items={departmentOptions}
                getId={getDepartmentId}
                getLabel={getDepartmentLabel}
                value={addForm.departmentId}
                onChange={handleDepartmentChange}
                placeholder={arabicSource("employees.select_the_section")}
              />
            </div>
            <div>
              <label className={fieldLabelClass} style={{ fontSize: 12 }}>
                {arabicSource("employees.job_position")}
              </label>
              <TypeAhead
                items={designationOptions}
                getId={getDesignationId}
                getLabel={getDesignationLabel}
                value={addForm.designationId}
                onChange={handleDesignationChange}
                placeholder={arabicSource("common.select")}
              />
            </div>
            <LabeledInput
              label={arabicSource("employees.salary_iqd")}
              type="number"
              value={addForm.salary}
              onChange={handleSalaryChange}
              placeholder="0"
              dir="ltr"
            />
            <LabeledInput
              label={arabicSource("common.direct_date")}
              type="date"
              value={addForm.joinDate}
              onChange={handleJoinDateChange}
              dir="ltr"
            />
          </div>
          <div className="mt-3">
            <LabeledInput
              label={arabicSource("common.address")}
              type="text"
              value={addForm.address}
              onChange={handleAddressChange}
              placeholder={arabicSource("employees.baghdad_region")}
            />
          </div>
        </div>

        <EmployeeDeviceSyncBanner status={deviceSyncStatus} />

        {addError && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {addError}
          </div>
        )}

        <div className="flex gap-3 pt-3">
          <Button
            onClick={onAddEmployee}
            loading={addSaving}
            disabled={!addForm.name.trim() || !nextEmployeeId}
            className="flex-1 h-11 shadow-lg shadow-primary/20"
          >
            {!addSaving && (
              <>
                <Fingerprint className="w-4 h-4" />
                <Plus className="w-4 h-4" />
              </>
            )}
            {addSaving
              ? arabicSource("common.saving")
              : arabicSource("employees.save_and_record_on_the_device")}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={addSaving}
            className="flex-1 h-11"
          >
            {arabicSource("common.cancel")}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AddEmployeeModal;
