import { ArrowLeft, Fingerprint, Plus } from "lucide-react";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { GeoCountry, GeoState, GeoCity } from "@/shared/api/geo";
import { arabicSource } from "@/i18n/source";
import { Button, ModalHeader, ModalOverlay } from "@/shared/components";
import type { AddEmployeeStep } from "../hooks/useEmployeeAddForm";
import type { DeviceEnrollment, EmployeeAddForm, EmployeeOption } from "../types";
import type { EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import AddEmployeeStepBasicInfo from "./AddEmployeeStepBasicInfo";
import AddEmployeeStepCredentials from "./AddEmployeeStepCredentials";

type AddEmployeeModalProps = {
  addForm: EmployeeAddForm;
  addStep: AddEmployeeStep;
  addSaving: boolean;
  addEnrolling: boolean;
  addError: string | null;
  birthDateError: string | null;
  /** Field-level `invalid_photo` / `photo_too_large` rejection for the face photo. */
  photoError: string | null;
  /** Field-level `department_not_found` / `designation_not_found` rejections (backend §4). */
  fieldErrors: EmployeeFieldErrors;
  addDeviceEnrollment: DeviceEnrollment | null;
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
  onGoToStep1: () => void;
  onGoToStep2: () => void;
  onAddEmployee: () => void;
  onClose: () => void;
};

const AddEmployeeModal = ({
  addForm,
  addStep,
  addSaving,
  addEnrolling,
  addError,
  birthDateError,
  photoError,
  fieldErrors,
  addDeviceEnrollment,
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
  onGoToStep1,
  onGoToStep2,
  onAddEmployee,
  onClose,
}: AddEmployeeModalProps) => {
  const handleModalClose = (): void => {
    if (!addSaving) onClose();
  };

  return (
    <ModalOverlay
      onClose={handleModalClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
    >
      <ModalHeader
        title={
          addStep === 1
            ? arabicSource("recruitment.basic_information")
            : arabicSource("employees.step_2_profile_enrolment")
        }
        onClose={handleModalClose}
        className="flex items-center justify-between mb-5"
      />
      <div className="space-y-4">
        {addStep === 1 ? (
          <AddEmployeeStepBasicInfo
            addForm={addForm}
            birthDateError={birthDateError}
            fieldErrors={fieldErrors}
            departmentOptions={departmentOptions}
            designationOptions={designationOptions}
            managerOptions={managerOptions}
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
        ) : (
          <AddEmployeeStepCredentials
            addForm={addForm}
            facePhotoPreview={facePhotoPreview}
            photoError={photoError}
            deviceEnrollment={addDeviceEnrollment}
            syncing={addEnrolling}
            onFormChange={onFormChange}
            onFacePhotoChange={onFacePhotoChange}
            onClearFacePhoto={onClearFacePhoto}
          />
        )}

        {addError && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {addError}
          </div>
        )}

        <div className="flex gap-3 pt-3">
          {addStep === 1 ? (
            <>
              <Button
                onClick={onGoToStep2}
                loading={loadingNextId}
                disabled={!addForm.name.trim() || !nextEmployeeId}
                className="flex-1 h-11 shadow-lg shadow-primary/20"
              >
                {arabicSource("common.next")}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={addSaving} className="flex-1 h-11">
                {arabicSource("common.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onGoToStep1}
                disabled={addSaving}
                className="h-11 px-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {arabicSource("hierarchy.change_manager_back")}
              </Button>
              <Button
                onClick={onAddEmployee}
                loading={addSaving}
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
            </>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AddEmployeeModal;
