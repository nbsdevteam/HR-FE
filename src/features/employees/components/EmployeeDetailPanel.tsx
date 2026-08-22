import { motion, AnimatePresence } from "motion/react";
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

const EmployeeDetailPanel = (props: EmployeeDetailPanelProps) => {
  const { onClose, allEmployees = [] } = props;
  const {
    addingNewDept,
    allDepts,
    editData,
    handleAddAttachment,
    handleAddCustody,
    handleCancelAddAttachment,
    handleCancelAddCustody,
    handleCancelEdit,
    handleCancelNewDept,
    handleCloseTerminationDialog,
    handleConfirmNewDept,
    handleDeleteAttachment,
    handleDeleteCustody,
    handleEditField,
    handleManagerChange,
    handleSave,
    handleTermination,
    isEditing,
    modalTab,
    newAttachment,
    newCustody,
    newDeptName,
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

  const handleNewCustodyChange = (patch: Partial<typeof newCustody>) =>
    setNewCustody({ ...newCustody, ...patch });
  const handleNewAttachmentChange = (patch: Partial<typeof newAttachment>) =>
    setNewAttachment({ ...newAttachment, ...patch });
  const handleToggleTerminationOption = (
    key: keyof typeof terminationOptions,
    checked: boolean,
  ) => setTerminationOptions((prev) => ({ ...prev, [key]: checked }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Full-screen panel sliding from the start (right in RTL) */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="ms-auto w-full max-w-[680px] h-full bg-card shadow-2xl flex flex-col overflow-hidden"
        style={{ borderInlineStart: "1px solid var(--border)" }}
      >
        <div
          className="shrink-0 px-6 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <EmployeeDetailHeader
            isEditing={isEditing}
            saving={saving}
            onStartEdit={() => setIsEditing(true)}
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
          custodiesCount={editData.custodies.length}
          leavesCount={editData.leaves.length}
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
                allEmployees={allEmployees}
                addingNewDept={addingNewDept}
                newDeptName={newDeptName}
                onFieldChange={handleEditField}
                onManagerChange={handleManagerChange}
                onStartAddingDept={() => setAddingNewDept(true)}
                onNewDeptNameChange={setNewDeptName}
                onConfirmNewDept={handleConfirmNewDept}
                onCancelNewDept={handleCancelNewDept}
              />
            )}

            {modalTab === "custodies" && (
              <EmployeeCustodiesTab
                custodies={editData.custodies}
                isEditing={isEditing}
                showAddCustody={showAddCustody}
                newCustody={newCustody}
                onToggleAddCustody={() => setShowAddCustody((prev) => !prev)}
                onNewCustodyChange={handleNewCustodyChange}
                onConfirmAddCustody={handleAddCustody}
                onCancelAddCustody={handleCancelAddCustody}
                onDeleteCustody={handleDeleteCustody}
              />
            )}

            {modalTab === "leaves" && (
              <EmployeeLeavesTab leaves={editData.leaves} />
            )}

            {modalTab === "attachments" && (
              <EmployeeAttachmentsTab
                attachments={editData.attachments}
                isEditing={isEditing}
                showAddAttachment={showAddAttachment}
                newAttachment={newAttachment}
                onToggleAddAttachment={() =>
                  setShowAddAttachment((prev) => !prev)
                }
                onNewAttachmentChange={handleNewAttachmentChange}
                onConfirmAddAttachment={handleAddAttachment}
                onCancelAddAttachment={handleCancelAddAttachment}
                onDeleteAttachment={handleDeleteAttachment}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
    </motion.div>
  );
};

export default EmployeeDetailPanel;
