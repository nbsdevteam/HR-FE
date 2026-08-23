import { Fingerprint, Loader2, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { ModalHeader, ModalOverlay, Select } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import EmployeeDeviceSyncBanner from "./EmployeeDeviceSyncBanner";
import EmployeeFingerprintSection from "./EmployeeFingerprintSection";
import LabeledInput from "./LabeledInput";

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

  const handleDepartmentChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    onFormChange({
      departmentId: e.target.value,
      designationId: "",
    });
  };

  const handleDesignationChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    onFormChange({ designationId: e.target.value });
  };

  const handleSalaryChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
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
            <Select
              label={arabicSource("common.section")}
              value={addForm.departmentId}
              onChange={handleDepartmentChange}
            >
              <option value="">
                {arabicSource("employees.select_the_section")}
              </option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              label={arabicSource("employees.job_position")}
              value={addForm.designationId}
              onChange={handleDesignationChange}
            >
              <option value="">{arabicSource("common.select")}</option>
              {designationOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title_ar || p.title_en || p.id}
                </option>
              ))}
            </Select>
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
          <button
            onClick={onAddEmployee}
            disabled={addSaving || !addForm.name.trim() || !nextEmployeeId}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {addSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <Plus className="w-4 h-4" />
              </>
            )}
            {addSaving
              ? arabicSource("common.saving")
              : arabicSource("employees.save_and_record_on_the_device")}
          </button>
          <button
            onClick={onClose}
            disabled={addSaving}
            className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            {arabicSource("common.cancel")}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AddEmployeeModal;
