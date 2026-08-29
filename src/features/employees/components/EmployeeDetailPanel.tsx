import { useCallback } from "react";
import { AnimatePresence, type HTMLMotionProps } from "motion/react";
import { ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { EmployeeDetailPanelProps } from "../types";
import { useEmployeeDetailPanel } from "../hooks/useEmployeeDetailPanel";
import EmployeeDetailHeader from "./EmployeeDetailHeader";
import EmployeeIdentityCard from "./EmployeeIdentityCard";
import EmployeeDetailTabs from "./EmployeeDetailTabs";
import EmployeeInfoTab from "./EmployeeInfoTab";
import EmployeeCustodiesTab from "./EmployeeCustodiesTab";
import EmployeeLeavesTab from "./EmployeeLeavesTab";
import EmployeeAttachmentsTab from "./EmployeeAttachmentsTab";
import EmployeeTerminationDialog from "./EmployeeTerminationDialog";

/** Full-height sheet: opaque scrim + a panel sliding in from the start edge. */
const PANEL_OVERLAY_CLASS = "fixed inset-0 z-50 flex bg-black/60 backdrop-blur-[4px]";

const PANEL_CONTENT_CLASS =
  "ms-auto w-full max-w-[680px] h-full bg-card border-s border-border shadow-2xl flex flex-col overflow-hidden";

const PANEL_CONTENT_MOTION: HTMLMotionProps<"div"> = {
  initial: { x: 80, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 80, opacity: 0 },
  transition: { type: "spring", damping: 28, stiffness: 300 },
};

const EmployeeDetailPanel = (props: EmployeeDetailPanelProps) => {
  const { onClose, allEmployees = [] } = props;
  const {
    addingNewDept,
    allDepts,
    allPositions,
    confirmAddLocationCity,
    creatingDept,
    creatingLocationCity,
    custodies,
    custodiesLoading,
    custodyError,
    dismissLocationCitySuggestions,
    editData,
    handleAddAttachment,
    handleAddCustody,
    handleAddLocationCity,
    handleCancelAddAttachment,
    handleCancelAddCustody,
    handleCancelEdit,
    handleCancelNewDept,
    handleCloseTerminationDialog,
    handleConfirmNewDept,
    handleDeleteAttachment,
    handleDeleteCustody,
    handleDepartmentSelect,
    handleEditField,
    handleLocationCitySearch,
    handleLocationCountryChange,
    handleLocationStateChange,
    handleManagerChange,
    handlePositionSelect,
    handleSave,
    handleTermination,
    handleUpdateCustody,
    isEditing,
    leaveError,
    leaves,
    leavesLoading,
    loadingLocationCities,
    loadingLocationCountries,
    loadingLocationStates,
    locationCities,
    locationCitySuggestions,
    locationCityCreateError,
    locationCountries,
    locationStates,
    modalTab,
    newAttachment,
    newCustody,
    newDeptName,
    resolvedDepartmentId,
    resolvedPositionId,
    saveError,
    saving,
    setAddingNewDept,
    setIsEditing,
    setModalTab,
    setNewAttachment,
    setNewCustody,
    setNewDeptName,
    setShowAddAttachment,
    setShowAddCustody,
    setTerminationOptions,
    showAddAttachment,
    showAddCustody,
    showTerminationDialog,
    terminationLoading,
    terminationOptions,
    terminationResult,
  } = useEmployeeDetailPanel(props);

  const handleNewCustodyChange = useCallback(
    (patch: Partial<typeof newCustody>) => setNewCustody({ ...newCustody, ...patch }),
    [newCustody, setNewCustody],
  );

  const handleNewAttachmentChange = useCallback(
    (patch: Partial<typeof newAttachment>) => setNewAttachment({ ...newAttachment, ...patch }),
    [newAttachment, setNewAttachment],
  );

  const handleToggleTerminationOption = useCallback(
    (key: keyof typeof terminationOptions, checked: boolean) =>
      setTerminationOptions((prev) => ({ ...prev, [key]: checked })),
    [setTerminationOptions],
  );

  const handleStartEdit = useCallback((): void => {
    setIsEditing(true);
  }, [setIsEditing]);

  const handleStartAddingDept = useCallback((): void => {
    setAddingNewDept(true);
  }, [setAddingNewDept]);

  const handleToggleAddCustody = useCallback((): void => {
    setShowAddCustody((prev) => !prev);
  }, [setShowAddCustody]);

  const handleToggleAddAttachment = useCallback((): void => {
    setShowAddAttachment((prev) => !prev);
  }, [setShowAddAttachment]);

  return (
    <>
      <ModalOverlay
        onClose={onClose}
        overlayClassName={PANEL_OVERLAY_CLASS}
        contentClassName={PANEL_CONTENT_CLASS}
        contentMotionProps={PANEL_CONTENT_MOTION}
      >
        <div
          className="shrink-0 px-6 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <EmployeeDetailHeader
            isEditing={isEditing}
            saving={saving}
            onStartEdit={handleStartEdit}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
            onClose={onClose}
          />
          <EmployeeIdentityCard editData={editData} />
        </div>

        {saveError && (
          <div
            className="shrink-0 mx-6 mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
            style={{ fontSize: 13 }}
          >
            {arabicSource("shared.error_saving")} {saveError}
          </div>
        )}
        <EmployeeDetailTabs
          modalTab={modalTab}
          custodiesCount={custodies.length}
          leavesCount={leaves.length}
          attachmentsCount={editData.attachments.length}
          onSelect={setModalTab}
        />
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {modalTab === "info" && (
              <EmployeeInfoTab
                editData={editData}
                isEditing={isEditing}
                allDepts={allDepts}
                departmentId={resolvedDepartmentId}
                allPositions={allPositions}
                positionId={resolvedPositionId}
                allEmployees={allEmployees}
                addingNewDept={addingNewDept}
                creatingDept={creatingDept}
                newDeptName={newDeptName}
                locationCountries={locationCountries}
                locationStates={locationStates}
                locationCities={locationCities}
                loadingLocationCountries={loadingLocationCountries}
                loadingLocationStates={loadingLocationStates}
                loadingLocationCities={loadingLocationCities}
                locationCitySuggestions={locationCitySuggestions}
                creatingLocationCity={creatingLocationCity}
                locationCityCreateError={locationCityCreateError}
                onFieldChange={handleEditField}
                onDepartmentSelect={handleDepartmentSelect}
                onPositionSelect={handlePositionSelect}
                onManagerChange={handleManagerChange}
                onStartAddingDept={handleStartAddingDept}
                onNewDeptNameChange={setNewDeptName}
                onConfirmNewDept={handleConfirmNewDept}
                onCancelNewDept={handleCancelNewDept}
                onLocationCountryChange={handleLocationCountryChange}
                onLocationStateChange={handleLocationStateChange}
                onLocationCitySearch={handleLocationCitySearch}
                onAddLocationCity={handleAddLocationCity}
                onConfirmAddLocationCity={confirmAddLocationCity}
                onDismissLocationCitySuggestions={dismissLocationCitySuggestions}
              />
            )}

            {modalTab === "custodies" && (
              <EmployeeCustodiesTab
                custodies={custodies}
                loading={custodiesLoading}
                error={custodyError}
                isEditing={isEditing}
                showAddCustody={showAddCustody}
                newCustody={newCustody}
                onToggleAddCustody={handleToggleAddCustody}
                onNewCustodyChange={handleNewCustodyChange}
                onConfirmAddCustody={handleAddCustody}
                onCancelAddCustody={handleCancelAddCustody}
                onDeleteCustody={handleDeleteCustody}
                onUpdateCustody={handleUpdateCustody}
              />
            )}

            {modalTab === "leaves" && (
              <EmployeeLeavesTab leaves={leaves} loading={leavesLoading} error={leaveError} />
            )}

            {modalTab === "attachments" && (
              <EmployeeAttachmentsTab
                attachments={editData.attachments}
                isEditing={isEditing}
                showAddAttachment={showAddAttachment}
                newAttachment={newAttachment}
                onToggleAddAttachment={handleToggleAddAttachment}
                onNewAttachmentChange={handleNewAttachmentChange}
                onConfirmAddAttachment={handleAddAttachment}
                onCancelAddAttachment={handleCancelAddAttachment}
                onDeleteAttachment={handleDeleteAttachment}
              />
            )}
          </AnimatePresence>
        </div>
      </ModalOverlay>

      {/* Sibling of the sheet, not a child: the sheet's slide transform would
          otherwise become the containing block for this dialog's fixed overlay. */}
      <AnimatePresence>
        {showTerminationDialog && (
          <EmployeeTerminationDialog
            terminationOptions={terminationOptions}
            onToggleOption={handleToggleTerminationOption}
            terminationLoading={terminationLoading}
            terminationResult={terminationResult}
            onConfirm={handleTermination}
            onClose={handleCloseTerminationDialog}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EmployeeDetailPanel;
