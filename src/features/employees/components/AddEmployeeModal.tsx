import { Fingerprint, Loader2, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import EmployeeDeviceSyncBanner from "./EmployeeDeviceSyncBanner";
import EmployeeFingerprintSection from "./EmployeeFingerprintSection";
import LabeledInput from "./LabeledInput";
import LabeledSelect from "./LabeledSelect";

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
}: AddEmployeeModalProps) => (
  <ModalOverlay
    onClose={() => {
      if (!addSaving) onClose();
    }}
    contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
  >
    <ModalHeader
      title={arabicSource("common.add_a_new_employee")}
      onClose={() => {
        if (!addSaving) onClose();
      }}
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
            onChange={(e) => onFormChange({ name: e.target.value })}
            placeholder={arabicSource("employees.enter_the_employee_s_name")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput
            label={arabicSource("common.id_number")}
            type="text"
            value={addForm.nationalId}
            onChange={(e) => onFormChange({ nationalId: e.target.value })}
            placeholder={arabicSource("employees.national_id_number")}
          />
          <LabeledInput
            label={arabicSource("common.email")}
            type="email"
            value={addForm.email}
            onChange={(e) => onFormChange({ email: e.target.value })}
            placeholder="example@company.iq"
          />
          <LabeledInput
            label={arabicSource("employees.personal_phone")}
            type="text"
            value={addForm.personalPhone}
            onChange={(e) => onFormChange({ personalPhone: e.target.value })}
            placeholder="07XXXXXXXXX"
          />
          <LabeledInput
            label={arabicSource("common.company_phone")}
            type="text"
            value={addForm.companyPhone}
            onChange={(e) => onFormChange({ companyPhone: e.target.value })}
            placeholder="07XXXXXXXXX"
          />
          <LabeledSelect
            label={arabicSource("common.section")}
            value={addForm.departmentId}
            onChange={(e) =>
              onFormChange({ departmentId: e.target.value, designationId: "" })
            }
          >
            <option value="">
              {arabicSource("employees.select_the_section")}
            </option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label={arabicSource("employees.job_position")}
            value={addForm.designationId}
            onChange={(e) => onFormChange({ designationId: e.target.value })}
          >
            <option value="">{arabicSource("common.select")}</option>
            {designationOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title_ar || p.title_en || p.id}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label={arabicSource("employees.salary_iqd")}
            type="number"
            value={addForm.salary}
            onChange={(e) => onFormChange({ salary: e.target.value })}
            placeholder="0"
            dir="ltr"
          />
          <LabeledInput
            label={arabicSource("common.direct_date")}
            type="date"
            value={addForm.joinDate}
            onChange={(e) => onFormChange({ joinDate: e.target.value })}
            dir="ltr"
          />
        </div>
        <div className="mt-3">
          <LabeledInput
            label={arabicSource("common.address")}
            type="text"
            value={addForm.address}
            onChange={(e) => onFormChange({ address: e.target.value })}
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

export default AddEmployeeModal;
