import { Fingerprint, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { CountryOption } from "@/shared/api/locationData";
import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm, EmployeeOption } from "../types";
import EmployeeCoreFields from "./EmployeeCoreFields";
import EmployeeDeviceSyncBanner from "./EmployeeDeviceSyncBanner";
import EmployeeFingerprintSection from "./EmployeeFingerprintSection";
import EmployeeLocationFields from "./EmployeeLocationFields";
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
  managerOptions: EmployeeOption[];
  countries: CountryOption[];
  states: string[];
  cities: string[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
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
  managerOptions,
  countries,
  states,
  cities,
  loadingCountries,
  loadingStates,
  loadingCities,
  onFormChange,
  onCountryChange,
  onStateChange,
  onFacePhotoChange,
  onClearFacePhoto,
  onAddEmployee,
  onClose,
}: AddEmployeeModalProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ name: e.target.value });
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
          <EmployeeCoreFields
            addForm={addForm}
            departmentOptions={departmentOptions}
            designationOptions={designationOptions}
            managerOptions={managerOptions}
            onFormChange={onFormChange}
          />
          <div className="mt-3">
            <LabeledInput
              label={arabicSource("common.address")}
              type="text"
              value={addForm.address}
              onChange={handleAddressChange}
              placeholder={arabicSource("employees.baghdad_region")}
            />
          </div>
          <div className="mt-3">
            <EmployeeLocationFields
              addForm={addForm}
              countries={countries}
              states={states}
              cities={cities}
              loadingCountries={loadingCountries}
              loadingStates={loadingStates}
              loadingCities={loadingCities}
              onFormChange={onFormChange}
              onCountryChange={onCountryChange}
              onStateChange={onStateChange}
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
