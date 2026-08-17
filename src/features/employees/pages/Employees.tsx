import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { EmployeeDetailPanel } from "@/features/employees";
import { arabicSource } from "@/i18n/source";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DeleteEmployeeModal from "../components/DeleteEmployeeModal";
import EmployeesFilters from "../components/EmployeesFilters";
import EmployeesHeader from "../components/EmployeesHeader";
import EmployeesKanbanView from "../components/EmployeesKanbanView";
import EmployeesListView from "../components/EmployeesListView";
import EmployeesStats from "../components/EmployeesStats";
import { useEmployeesPage } from "../hooks/useEmployeesPage";

export const Employees = () => {
  const {
    addError,
    addForm,
    addSaving,
    allEmployees,
    closeAddModal,
    closeDeleteModal,
    dbDepartmentOptions,
    dbEmployees,
    dbLoading,
    deleteConfirm,
    deleting,
    designationOptions,
    deviceSyncedSet,
    deviceSyncStatus,
    employeeOptions,
    facePhotoPreview,
    filtered,
    handleAddEmployee,
    handleClearFacePhoto,
    handleDeleteEmployee,
    handleDetailClose,
    handleDetailSave,
    handleFacePhoto,
    kanbanDepts,
    loadingNextId,
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
    setSelectedEmployee,
    setSortBy,
    setSortDir,
    setViewMode,
    showAddModal,
    sortBy,
    sortDir,
    updateAddForm,
    viewMode,
  } = useEmployeesPage();

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("employees.loading_employee_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeesHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddEmployee={openAddModal}
      />

      <EmployeesStats employees={allEmployees} deviceSyncedCount={deviceSyncedSet.size} />

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
            onSelectEmployee={setSelectedEmployee}
            onDeleteTargetChange={setDeleteConfirm}
          />
        ) : (
          <EmployeesKanbanView
            departments={kanbanDepts}
            employees={filtered}
            dbEmployees={dbEmployees}
            selectedDept={selectedDept}
            onSelectEmployee={setSelectedEmployee}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDetailPanel
            employee={selectedEmployee}
            onClose={handleDetailClose}
            onSave={handleDetailSave}
            allEmployees={employeeOptions}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddEmployeeModal
            addForm={addForm}
            addSaving={addSaving}
            addError={addError}
            deviceSyncStatus={deviceSyncStatus}
            nextEmployeeId={nextEmployeeId}
            loadingNextId={loadingNextId}
            facePhotoPreview={facePhotoPreview}
            departmentOptions={dbDepartmentOptions}
            designationOptions={designationOptions}
            onFormChange={updateAddForm}
            onFacePhotoChange={handleFacePhoto}
            onClearFacePhoto={handleClearFacePhoto}
            onAddEmployee={handleAddEmployee}
            onClose={closeAddModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <DeleteEmployeeModal
            deleteConfirm={deleteConfirm}
            deleting={deleting}
            onDelete={handleDeleteEmployee}
            onClose={closeDeleteModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
