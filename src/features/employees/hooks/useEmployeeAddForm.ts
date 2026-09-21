import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import { birthDateFieldError } from "../utils/birthDate";
import { employeeFieldErrors, NO_EMPLOYEE_FIELD_ERRORS, type EmployeeFieldErrors } from "../utils/employeeFieldErrors";
import { buildEmployeeCreatePayload } from "../utils/employeeCreatePayload";
import { errorMessage } from "../utils/errorMessage";
import { photoFieldError } from "../utils/photoFieldError";
import { useEmployeeLocationOptions } from "./useEmployeeLocationOptions";

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
};

export const useEmployeeAddForm = (designations: DbPosition[], refetch: () => void) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeAddForm>(defaultAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EmployeeFieldErrors>(NO_EMPLOYEE_FIELD_ERRORS);
  const [deviceSyncStatus, setDeviceSyncStatus] = useState<DeviceSyncStatus>("idle");
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
  const [nextDeviceNo, setNextDeviceNo] = useState<number | string | null>(null);
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [facePhotoBase64, setFacePhotoBase64] = useState<string | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);

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

  const closeAddTimeoutRef = useRef<number | null>(null);

  const designationOptions = useMemo(
    () => addForm.departmentId
      ? designations.filter(p => !p.department_id || p.department_id === addForm.departmentId)
      : designations,
    [designations, addForm.departmentId],
  );

  const resetAddForm = useCallback(() => {
    setAddForm(defaultAddForm);
    setAddError(null);
    setBirthDateError(null);
    setPhotoError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);
    setDeviceSyncStatus("idle");
    setNextEmployeeId(null);
    setNextDeviceNo(null);
    setFacePhotoBase64(null);
    setFacePhotoPreview(null);
    resetLocationOptions();
  }, [resetLocationOptions]);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const data = await odooData.fetchNextEmployeeCode();
      setNextEmployeeId(data?.next_id ?? null);
      setNextDeviceNo(data?.next_device_no ?? null);
    } catch {
      // No client-side guess (MAX+1 can reuse a retired id): surface the error and let the admin retry.
      setNextEmployeeId(null);
      setNextDeviceNo(null);
      setAddError(arabicSource("employees.employee_number_not_specified"));
    }
    setLoadingNextId(false);
  }, []);

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

  const handleClearFacePhoto = useCallback(() => {
    setFacePhotoPreview(null);
    setFacePhotoBase64(null);
    setPhotoError(null);
  }, []);

  const handleFacePhoto = useCallback((file: File) => {
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFacePhotoPreview(result);
      setFacePhotoBase64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddEmployee = useCallback(async () => {
    if (!addForm.name.trim()) { setAddError(arabicSource("employees.name_required")); return; }
    if (!nextEmployeeId) { setAddError(arabicSource("employees.employee_number_not_specified")); return; }
    if (addForm.joinDate && addForm.joinDate > todayInBaghdad()) {
      setAddError(arabicSource("employees.join_date_cannot_be_in_the_future"));
      return;
    }
    // The picker is already capped at today; this catches a typed-in date and
    // keeps `birth_date_in_future` a backstop rather than a round trip.
    if (addForm.birthDate && addForm.birthDate > todayInBaghdad()) {
      setBirthDateError(arabicSource("employees.birth_date_cannot_be_in_the_future"));
      return;
    }
    setAddSaving(true);
    setAddError(null);
    setBirthDateError(null);
    setPhotoError(null);
    setFieldErrors(NO_EMPLOYEE_FIELD_ERRORS);

    try {
      const newPersonId = nextEmployeeId;

      const createdEmployee = await createEmployeeMutation.mutateAsync(
        buildEmployeeCreatePayload(addForm, newPersonId, facePhotoPreview, nextDeviceNo),
      );
      // Odoo may remap the requested number if it was taken by the time create()
      // ran (second admin, stale pre-fetch). The device must always be enrolled
      // under whatever Odoo actually saved, never the number shown pre-submit.
      const savedDeviceNo = (createdEmployee as { device_employee_no?: string } | null)?.device_employee_no
        || String(nextDeviceNo ?? newPersonId);

      setDeviceSyncStatus("syncing");
      try {
        const syncRes = await fetch(`${SYNC_API}/device/sync-employee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeNo: savedDeviceNo,
            name: addForm.name,
            gender: addForm.gender,
            facePhoto: facePhotoBase64 || undefined,
          }),
        });
        const syncData = await syncRes.json();
        setDeviceSyncStatus(syncData.success ? "success" : "error");
      } catch {
        setDeviceSyncStatus("error");
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
  }, [addForm, createEmployeeMutation.mutateAsync, facePhotoBase64, facePhotoPreview, nextDeviceNo, nextEmployeeId, refetch, resetAddForm]);

  useEffect(() => {
    return () => {
      if (closeAddTimeoutRef.current) window.clearTimeout(closeAddTimeoutRef.current);
    };
  }, []);

  return {
    addError,
    addForm,
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
    deviceSyncStatus,
    dismissCitySuggestions,
    facePhotoPreview,
    fieldErrors,
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
