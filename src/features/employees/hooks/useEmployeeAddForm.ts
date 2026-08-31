import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { DbEmployee, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { arabicSource } from "@/i18n/source";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
import { birthDateFieldError } from "../utils/birthDate";
import { buildEmployeeCreatePayload } from "../utils/employeeCreatePayload";
import { errorMessage } from "../utils/errorMessage";
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

export const useEmployeeAddForm = (dbEmployees: DbEmployee[], designations: DbPosition[], refetch: () => void) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeAddForm>(defaultAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [deviceSyncStatus, setDeviceSyncStatus] = useState<DeviceSyncStatus>("idle");
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
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
    setDeviceSyncStatus("idle");
    setNextEmployeeId(null);
    setFacePhotoBase64(null);
    setFacePhotoPreview(null);
    resetLocationOptions();
  }, [resetLocationOptions]);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const data = await odooData.fetchNextEmployeeCode();
      if (data?.next_id) setNextEmployeeId(data.next_id);
      else {
        const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
        setNextEmployeeId(maxPerson + 1);
      }
    } catch {
      const maxPerson = dbEmployees.reduce((max, e) => Math.max(max, e.person_id || 0), 0);
      setNextEmployeeId(maxPerson + 1);
    }
    setLoadingNextId(false);
  }, [dbEmployees]);

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
  }, []);

  const handleFacePhoto = useCallback((file: File) => {
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

    try {
      const newPersonId = nextEmployeeId;

      await odooData.createEmployee(buildEmployeeCreatePayload(addForm, newPersonId));

      setDeviceSyncStatus("syncing");
      try {
        const syncRes = await fetch(`${SYNC_API}/device/sync-employee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeNo: String(newPersonId),
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
      const fieldError = birthDateFieldError(error);
      if (fieldError) setBirthDateError(fieldError);
      else setAddError(errorMessage(error));
    }
    setAddSaving(false);
  }, [addForm, facePhotoBase64, nextEmployeeId, refetch, resetAddForm]);

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
    showAddModal,
    states,
    updateAddForm,
  };
};
