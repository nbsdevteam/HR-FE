import { lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { ConfirmDeleteModal } from "@/shared/components";
import EmployeesFilters from "../components/EmployeesFilters";
import EmployeesHeader from "../components/EmployeesHeader";
import EmployeesListView from "../components/EmployeesListView";
import EmployeesStats from "../components/EmployeesStats";
import { useEmployeesPage } from "../hooks/useEmployeesPage";
import LoadingState from "@/shared/components/LoadingState";

const EmployeesKanbanView = lazy(
  () => import("../components/EmployeesKanbanView"),
);

const AddEmployeeModal = lazy(() => import("../components/AddEmployeeModal"));

const EmployeeDetailPanel = lazy(() =>
  import("@/features/employees").then((module) => ({
    default: module.EmployeeDetailPanel,
  })),
);

const Employees = () => {
  const {
    addError,
    addForm,
    addSaving,
    allEmployees,
    birthDateError,
    cities,
    citySuggestions,
    closeAddModal,
    closeDeleteModal,
    confirmAddCity,
    countries,
    creatingCity,
    cityCreateError,
    dbDepartmentOptions,
    dbEmployees,
    dbLoading,
    deleteConfirm,
    deleting,
    designationOptions,
    designations,
    detailStartsInEditMode,
    deviceSyncedSet,
    deviceSyncStatus,
    dismissCitySuggestions,
    employeeOptions,
    facePhotoPreview,
    filtered,
    handleAddCity,
    handleAddEmployee,
    handleCitySearch,
    handleClearFacePhoto,
    handleCityChange,
    handleCountryChange,
    handleDeleteEmployee,
    handleDetailClose,
    handleDetailSave,
    handleEditEmployee,
    handleFacePhoto,
    handleSelectEmployee,
    handleStateChange,
    kanbanDepts,
    loadingCities,
    loadingCountries,
    loadingNextId,
    loadingStates,
    nextEmployeeId,
    openAddModal,
    pendingEmployees,
    realDepts,
    search,
    selectedDept,
    selectedEmployee,
    setDeleteConfirm,
    setSearch,
    setSelectedDept,
    setSortBy,
    setSortDir,
    setViewMode,
    showAddModal,
    sortBy,
    sortDir,
    states,
    updateAddForm,
    viewMode,
  } = useEmployeesPage();

  if (dbLoading) {
    return <LoadingState message={arabicSource("employees.loading_employee_data")} />;
  }

  return (
    <div className="space-y-6">
      <EmployeesHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddEmployee={openAddModal}
      />

      <EmployeesStats
        employees={allEmployees}
        deviceSyncedCount={deviceSyncedSet.size}
      />

      <EmployeesFilters
        search={search}
        selectedDept={selectedDept}
        departments={realDepts}
        onSearchChange={setSearch}
        onDepartmentChange={setSelectedDept}
      />

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <EmployeesListView
            employees={filtered}
            dbEmployees={dbEmployees}
            deviceSyncedSet={deviceSyncedSet}
            pendingEmployees={pendingEmployees}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortByChange={setSortBy}
            onSortDirChange={setSortDir}
            onSelectEmployee={handleSelectEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteTargetChange={setDeleteConfirm}
          />
        ) : (
          <Suspense
            fallback={<LoadingState message={arabicSource("common.loading")} />}
          >
            <EmployeesKanbanView
              departments={kanbanDepts}
              employees={filtered}
              dbEmployees={dbEmployees}
              selectedDept={selectedDept}
              onSelectEmployee={handleSelectEmployee}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmployee && (
          <Suspense
            fallback={<LoadingState message={arabicSource("common.loading")} />}
          >
            <EmployeeDetailPanel
              employee={selectedEmployee}
              onClose={handleDetailClose}
              onSave={handleDetailSave}
              allEmployees={employeeOptions}
              dbDepartments={dbDepartmentOptions}
              designations={designations}
              startInEditMode={detailStartsInEditMode}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <Suspense
            fallback={<LoadingState message={arabicSource("common.loading")} />}
          >
            <AddEmployeeModal
              addForm={addForm}
              addSaving={addSaving}
              addError={addError}
              birthDateError={birthDateError}
              deviceSyncStatus={deviceSyncStatus}
              nextEmployeeId={nextEmployeeId}
              loadingNextId={loadingNextId}
              facePhotoPreview={facePhotoPreview}
              departmentOptions={dbDepartmentOptions}
              designationOptions={designationOptions}
              managerOptions={employeeOptions}
              countries={countries}
              states={states}
              cities={cities}
              loadingCountries={loadingCountries}
              loadingStates={loadingStates}
              loadingCities={loadingCities}
              citySuggestions={citySuggestions}
              creatingCity={creatingCity}
              cityCreateError={cityCreateError}
              onFormChange={updateAddForm}
              onCountryChange={handleCountryChange}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
              onCitySearch={handleCitySearch}
              onAddCity={handleAddCity}
              onConfirmAddCity={confirmAddCity}
              onDismissCitySuggestions={dismissCitySuggestions}
              onFacePhotoChange={handleFacePhoto}
              onClearFacePhoto={handleClearFacePhoto}
              onAddEmployee={handleAddEmployee}
              onClose={closeAddModal}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmDeleteModal
            title={arabicSource("employees.confirm_deletion")}
            message={
              <>
                {arabicSource("employees.are_you_sure_you_want_to_delete_the_employee")}{" "}
                <span className="text-foreground font-medium">{deleteConfirm.name}</span>
                {arabicSource("employees.all_his_data_will_be_deleted_from_the_system_and_he_will_be_remo")}
              </>
            }
            confirmLabel={arabicSource("employees.delete_employee")}
            loadingLabel={arabicSource("employees.deleting")}
            loading={deleting}
            onConfirm={handleDeleteEmployee}
            onClose={closeDeleteModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;
