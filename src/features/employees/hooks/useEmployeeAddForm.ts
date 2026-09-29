import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { DbPosition, DeviceEnrollment } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { mapEmployee } from "@/shared/api/mappers";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { EmployeeAddForm } from "../types";
import { birthDateFieldError } from "../utils/birthDate";
import { employeeFieldErrors, NO_EMPLOYEE_FIELD_ERRORS, type EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import { buildEmployeeCreatePayload } from "../utils/employeeCreatePayload";
import { errorMessage } from "../utils/errorMessage";
import { photoFieldError } from "../utils/photoFieldError";
import { useDeviceEnrollmentSync } from "./useDeviceEnrollmentSync";
import { useEmployeeAddFacePhoto } from "./useEmployeeAddFacePhoto";
import { useEmployeeLocationOptions } from "./useEmployeeLocationOptions";
import { useNextEmployeeCode } from "./useNextEmployeeCode";

export type AddEmployeeStep = 1 | 2;

const defaultAddForm: EmployeeAddForm = {
  name: "",
  email: "",
  personalPhone: "",
  companyPhone: "",
  designationId: "",
  departmentId: "",
  salary: "",
  joinDate: "",
  birthDate: "",
  nationalId: "",
  gender: "male",
  managerId: "",
  nationality: "",
  country: "",
  countryId: "",
  state: "",
  stateId: "",
  city: "",
  cityId: "",
  residence: "",
  workLocation: "local",
  cardNumber: "",
  enrollFingerprint: false,
};

export const useEmployeeAddForm = (designations: DbPosition[], refetch: () => void) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeAddForm>(defaultAddForm);
  const [addStep, setAddStep] = useState<AddEmployeeStep>(1);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EmployeeFieldErrors>(NO_EMPLOYEE_FIELD_ERRORS);
  const [addDeviceEnrollment, setAddDeviceEnrollment] = useState<DeviceEnrollment | null>(null);

  const {
    photoError,
    setPhotoError,
    facePhotoBase64,
    facePhotoPreview,
    handleClearFacePhoto,
    handleFacePhoto,
  } = useEmployeeAddFacePhoto();
  const {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    citySuggestions,
    creatingCity,
    cityCreateError,
    loadCountries,
    loadStates,
    loadCities,
    searchCities,
    requestAddCity,
    confirmAddCity,
    dismissCitySuggestions,
    resetLocationOptions,
  } = useEmployeeLocationOptions();
  const isArabic = useIsArabicLanguage();
  const createEmployeeMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createEmployee(payload),
    // A new employee can be created with a photo already attached.
    ["employees", "employeeAvatars"],
  );
  const { nextEmployeeId, loadingNextId, fetchNextId, resetNextId } = useNextEmployeeCode(setAddError);
  const { syncing: addEnrolling, runEnrollment } = useDeviceEnrollmentSync();

  const closeAddTimeoutRef = useRef<number | null>(null);

  const designationOptions = useMemo(
    () => addForm.departmentId
      ? designations.filter(p => !p.department_id || p.department_id === addForm.departmentId)
      : designations,
    [designations, addForm.departmentId],
  );

  const resetAddForm = useCallback(() => {
    setAddForm(defaultAddForm);
    setAddStep(1);
    setAddError(null);
    setBirthDateError(null);
    setPhotoError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);
    setAddDeviceEnrollment(null);
    resetNextId();
    handleClearFacePhoto();
    resetLocationOptions();
  }, [handleClearFacePhoto, resetLocationOptions, resetNextId]);

  const openAddModal = useCallback(() => {
    setShowAddModal(true);
    void fetchNextId();
    void loadCountries();
  }, [fetchNextId, loadCountries]);

  const closeAddModal = useCallback(() => {
    if (addSaving) return;
    setShowAddModal(false);
    resetAddForm();
  }, [addSaving, resetAddForm]);

  const updateAddForm = useCallback((updates: Partial<EmployeeAddForm>) => {
    // Editing the date clears the rejection it caused, so a stale message never
    // sits under an input the user has already corrected.
    if (updates.birthDate !== undefined) setBirthDateError(null);
    // Same for the two FK dropdowns: re-picking a department or job title
    // clears the "no longer exists" message the previous choice produced.
    if (updates.departmentId !== undefined) setFieldErrors(prev => ({ ...prev, department: null }));
    if (updates.designationId !== undefined) setFieldErrors(prev => ({ ...prev, designation: null }));
    setAddForm(current => ({ ...current, ...updates }));
  }, []);

  const handleCountryChange = useCallback((countryId: string) => {
    const country = countries.find(c => String(c.id) === countryId);
    const countryName = country ? (isArabic ? country.name_ar || country.name : country.name) : "";
    setAddForm(current => ({
      ...current,
      country: countryName,
      countryId,
      state: "",
      stateId: "",
      city: "",
      cityId: "",
    }));
    void loadStates(countryId);
  }, [countries, loadStates, isArabic]);

  const handleStateChange = useCallback((stateId: string) => {
    const state = states.find(s => String(s.id) === stateId);
    const stateName = state ? (isArabic ? state.name_ar || state.name : state.name) : "";
    setAddForm(current => ({ ...current, state: stateName, stateId, city: "", cityId: "" }));
    void loadCities(stateId);
  }, [states, loadCities, isArabic]);

  const handleCityChange = useCallback((cityId: string) => {
    const city = cities.find(c => String(c.id) === cityId);
    const cityName = city ? (isArabic ? city.name_ar || city.name : city.name) : "";
    setAddForm(current => ({ ...current, city: cityName, cityId }));
  }, [cities, isArabic]);

  const handleCitySearch = useCallback((query: string) => {
    searchCities(addForm.stateId, query);
  }, [searchCities, addForm.stateId]);

  const handleAddCity = useCallback(
    (name: string) => requestAddCity(addForm.stateId, name),
    [requestAddCity, addForm.stateId],
  );

  /** Re-runs step 1's own guards before advancing — step 2 never opens on an invalid step-1 form. */
  const goToStep2 = useCallback(() => {
    if (!addForm.name.trim()) { setAddError(arabicSource("employees.name_required")); return; }
    if (!nextEmployeeId) { setAddError(arabicSource("employees.employee_number_not_specified")); return; }
    if (addForm.joinDate && addForm.joinDate > todayInBaghdad()) {
      setAddError(arabicSource("employees.join_date_cannot_be_in_the_future"));
      return;
    }
    if (addForm.birthDate && addForm.birthDate > todayInBaghdad()) {
      setBirthDateError(arabicSource("employees.birth_date_cannot_be_in_the_future"));
      return;
    }
    setAddError(null);
    setAddStep(2);
  }, [addForm.name, addForm.joinDate, addForm.birthDate, nextEmployeeId]);

  const goToStep1 = useCallback(() => {
    setAddStep(1);
  }, []);

  const handleAddEmployee = useCallback(async () => {
    setAddSaving(true);
    setAddError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);

    try {
      const newPersonId = nextEmployeeId as number;
      const cardNumber = addForm.cardNumber.trim();
      const deviceCredentials = [
        ...(facePhotoBase64 ? (["face"] as const) : []),
        ...(cardNumber ? (["card"] as const) : []),
        ...(addForm.enrollFingerprint ? (["fingerprint"] as const) : []),
      ];

      const createdEmployeeRaw = await createEmployeeMutation.mutateAsync(
        buildEmployeeCreatePayload(addForm, newPersonId, facePhotoPreview, deviceCredentials),
      );
      // Odoo allocates the device number and echoes it back on the response —
      // the device must always be enrolled under whatever Odoo actually saved,
      // never a number computed or shown pre-submit (hand-off §1/§2).
      const created = mapEmployee(createdEmployeeRaw);
      const savedDeviceNo = created.device_employee_no;
      const enrollment = created.device_enrollment;
      setAddDeviceEnrollment(enrollment);

      if (savedDeviceNo && enrollment && enrollment.pending.length > 0) {
        const outcome = await runEnrollment({
          dbId: created.id,
          deviceEmployeeNo: savedDeviceNo,
          mode: enrollment.mode === "update" ? "update" : "create",
          credentials: enrollment.pending,
          name: addForm.name,
          gender: addForm.gender,
          facePhotoBase64,
          cardNo: cardNumber || null,
        });
        if (outcome.deviceEnrollment) setAddDeviceEnrollment(outcome.deviceEnrollment);
      }

      refetch();
      closeAddTimeoutRef.current = window.setTimeout(() => {
        setShowAddModal(false);
        resetAddForm();
      }, 1500);
    } catch (error: unknown) {
      const birthError = birthDateFieldError(error);
      const rejectedFields = employeeFieldErrors(error);
      const photoErr = photoFieldError(error);
      if (birthError) setBirthDateError(birthError);
      else if (photoErr) setPhotoError(photoErr);
      else if (rejectedFields) setFieldErrors(rejectedFields);
      else setAddError(errorMessage(error));
    }
    setAddSaving(false);
  }, [addForm, createEmployeeMutation.mutateAsync, facePhotoBase64, facePhotoPreview, nextEmployeeId, refetch, resetAddForm, runEnrollment]);

  useEffect(() => {
    return () => {
      if (closeAddTimeoutRef.current) window.clearTimeout(closeAddTimeoutRef.current);
    };
  }, []);

  return {
    addDeviceEnrollment,
    addEnrolling,
    addError,
    addForm,
    addStep,
    birthDateError,
    addSaving,
    cities,
    citySuggestions,
    closeAddModal,
    confirmAddCity,
    countries,
    creatingCity,
    cityCreateError,
    designationOptions,
    dismissCitySuggestions,
    facePhotoPreview,
    fieldErrors,
    goToStep1,
    goToStep2,
    handleAddCity,
    handleAddEmployee,
    handleCitySearch,
    handleClearFacePhoto,
    handleCountryChange,
    handleCityChange,
    handleFacePhoto,
    handleStateChange,
    loadingCities,
    loadingCountries,
    loadingNextId,
    loadingStates,
    nextEmployeeId,
    openAddModal,
    photoError,
    showAddModal,
    states,
    updateAddForm,
  };
};
