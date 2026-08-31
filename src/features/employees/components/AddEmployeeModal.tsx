import { Fingerprint, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay } from "@/shared/components";
import type { DeviceSyncStatus, EmployeeAddForm, EmployeeOption } from "../types";
import type { EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import EmployeeCoreFields from "./EmployeeCoreFields";
import EmployeeDeviceSyncBanner from "./EmployeeDeviceSyncBanner";
import EmployeeFingerprintSection from "./EmployeeFingerprintSection";
import EmployeeLocationFields from "./EmployeeLocationFields";
import LabeledInput from "./LabeledInput";

type AddEmployeeModalProps = {
  addForm: EmployeeAddForm;
  addSaving: boolean;
  addError: string | null;
  birthDateError: string | null;
  /** Field-level `department_not_found` / `designation_not_found` rejections (backend §4). */
  fieldErrors: EmployeeFieldErrors;
  deviceSyncStatus: DeviceSyncStatus;
  nextEmployeeId: number | null;
  loadingNextId: boolean;
  facePhotoPreview: string | null;
  departmentOptions: DbDepartment[];
  designationOptions: DbPosition[];
  managerOptions: EmployeeOption[];
  countries: GeoCountry[];
  states: GeoState[];
  cities: GeoCity[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities: boolean;
  citySuggestions: GeoCity[];
  creatingCity: boolean;
  cityCreateError: string | null;
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCitySearch: (query: string) => void;
  onAddCity: (name: string) => Promise<GeoCity | null>;
  onConfirmAddCity: () => Promise<GeoCity | null>;
  onDismissCitySuggestions: () => void;
  onFacePhotoChange: (file: File) => void;
  onClearFacePhoto: () => void;
  onAddEmployee: () => void;
  onClose: () => void;
};

const AddEmployeeModal = ({
  addForm,
  addSaving,
  addError,
  birthDateError,
  fieldErrors,
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
  citySuggestions,
  creatingCity,
  cityCreateError,
  onFormChange,
  onCountryChange,
  onStateChange,
  onCityChange,
  onCitySearch,
  onAddCity,
  onConfirmAddCity,
  onDismissCitySuggestions,
  onFacePhotoChange,
  onClearFacePhoto,
  onAddEmployee,
  onClose,
}: AddEmployeeModalProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ name: e.target.value });
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
            birthDateError={birthDateError}
            fieldErrors={fieldErrors}
            onFormChange={onFormChange}
          />
          <div className="mt-3">
            <EmployeeLocationFields
              addForm={addForm}
              countries={countries}
              states={states}
              cities={cities}
              loadingCountries={loadingCountries}
              loadingStates={loadingStates}
              loadingCities={loadingCities}
              citySuggestions={citySuggestions}
              creatingCity={creatingCity}
              cityCreateError={cityCreateError}
              onFormChange={onFormChange}
              onCountryChange={onCountryChange}
              onStateChange={onStateChange}
              onCityChange={onCityChange}
              onCitySearch={onCitySearch}
              onAddCity={onAddCity}
              onConfirmAddCity={onConfirmAddCity}
              onDismissCitySuggestions={onDismissCitySuggestions}
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
