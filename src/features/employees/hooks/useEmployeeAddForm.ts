import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { DbEmployee, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { DeviceSyncStatus, EmployeeAddForm } from "../types";
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
    setAddSaving(true);
    setAddError(null);

    try {
      const newPersonId = nextEmployeeId;

      // The backend takes address as a single nested object (§3 of the address
      // spec) — only include the keys the user actually filled in. Ids come
      // from picking an item off the country/state/city dropdowns, so they're
      // always present alongside a name; send the id — "the id wins" server-side.
      const address: Record<string, string | number> = {};
      if (addForm.countryId) address.country_id = Number(addForm.countryId);
      else if (addForm.country) address.country = addForm.country;
      if (addForm.stateId) address.state_id = Number(addForm.stateId);
      else if (addForm.state) address.state = addForm.state;
      if (addForm.cityId) address.city_id = Number(addForm.cityId);
      else if (addForm.city) address.city = addForm.city;
      if (addForm.residence) address.residence = addForm.residence;

      await odooData.createEmployee({
        name: addForm.name,
        email: addForm.email || null,
        personal_phone: addForm.personalPhone || null,
        phone: addForm.personalPhone || addForm.companyPhone || null,
        address,
        monthly_salary: parseFloat(addForm.salary) || 0,
        join_date: addForm.joinDate || null,
        national_id: addForm.nationalId || null,
        status: "active",
        person_id: newPersonId,
        device_employee_no: String(newPersonId),
        gender: addForm.gender || null,
        manager_id: addForm.managerId || null,
        department_id: addForm.departmentId || null,
        designation_id: addForm.designationId || null,
        nationality: addForm.nationality || null,
        work_location: addForm.workLocation || "",
      });

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
      setAddError(errorMessage(error));
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
