import {
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import { labelCls } from "../styles";
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
          <LabeledSelect
            label={arabicSource("employees.gender")}
            value={addForm.gender}
            onChange={(e) =>
              onFormChange({ gender: e.target.value as "male" | "female" })
            }
          >
            <option value="male">{arabicSource("common.male")}</option>
            <option value="female">{arabicSource("common.female")}</option>
          </LabeledSelect>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFacePhotoChange(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {arabicSource("employees.jpg_or_png_max_200kb")}
            </span>
          </div>
        </div>
      </div>

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

      {deviceSyncStatus !== "idle" && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            deviceSyncStatus === "syncing"
              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
              : deviceSyncStatus === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
          }`}
        >
          {deviceSyncStatus === "syncing" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {arabicSource(
                  "employees.synchronizing_data_with_the_fingerprint_device",
                )}
              </span>
            </>
          )}
          {deviceSyncStatus === "success" && (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">
                {arabicSource(
                  "employees.the_employee_was_successfully_created_and_registered_on_the_fing",
                )}
              </span>
            </>
          )}
          {deviceSyncStatus === "error" && (
            <>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {arabicSource(
                  "employees.saved_to_the_system_but_synchronization_with_the_device_failed_w",
                )}
              </span>
            </>
          )}
        </div>
      )}

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
