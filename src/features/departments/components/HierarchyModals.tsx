import { lazy, memo, Suspense } from "react";
import type React from "react";
import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { DbEmployee, DbDepartment } from "@/shared/hooks";
import type { OrgNode } from "../types";
import DeleteConfirmModal from "./DeleteConfirmModal";
import type { PositionFormState } from "./PositionFormModal";

const SetupHierarchyModal = lazy(() => import("./SetupHierarchyModal"));
const CleanupDuplicatesModal = lazy(() => import("./CleanupDuplicatesModal"));
const UnlinkedPanel = lazy(() => import("./UnlinkedPanel"));
const EditEmployeeModal = lazy(() => import("./EditEmployeeModal"));
const AddEmployeeModal = lazy(() => import("./AddEmployeeModal"));
const AddDepartmentModal = lazy(() => import("./AddDepartmentModal"));
const PositionFormModal = lazy(() => import("./PositionFormModal"));
const DetailPanel = lazy(() => import("./DetailPanel"));

type HierarchyModalsProps = {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  orgTree: OrgNode;
  allNodes: OrgNode[];
  departments: string[];
  deptColors: Record<string, string>;
  unlinkedEmps: DbEmployee[];
  saving: boolean;
  selectedNode: OrgNode | null;
  showAddModal: boolean;
  addModalManagerId: number | null;
  deleteTarget: OrgNode | null;
  editTarget: OrgNode | null;
  showUnlinked: boolean;
  showSetupModal: boolean;
  showCleanupModal: boolean;
  showAddDepartmentModal: boolean;
  showAddPositionModal: boolean;
  posForm: PositionFormState;
  setPosForm: Dispatch<SetStateAction<PositionFormState>>;
  positionSaving: boolean;
  onAddEmployee: (parentDbId: string, name: string, position: string, department: string) => Promise<void>;
  onDeleteEmployee: (node: OrgNode, reparent: boolean) => Promise<void>;
  onEditEmployee: (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => Promise<void>;
  onLinkEmployee: (empDbId: string, managerDbId: string) => Promise<void>;
  onAddDepartment: (name: string, color: string) => Promise<void>;
  onSetupHierarchy: () => Promise<void>;
  onCleanupDuplicates: () => Promise<void>;
  onCloseSelectedNode: () => void;
  onCloseAddModal: () => void;
  onCloseDeleteModal: () => void;
  onCloseEditModal: () => void;
  onCloseUnlinkedPanel: () => void;
  onCloseSetupModal: () => void;
  onCloseCleanupModal: () => void;
  onCloseAddDepartmentModal: () => void;
  onAddPosition: () => Promise<void>;
  onCloseAddPositionModal: () => void;
  onDetailAddChild: (id: number) => void;
  onDetailDelete: (node: OrgNode) => void;
  onDetailEdit: (node: OrgNode) => void;
};

const HierarchyModals = ({
  dbEmployees,
  dbDepartments,
  orgTree,
  allNodes,
  departments,
  deptColors,
  unlinkedEmps,
  saving,
  selectedNode,
  showAddModal,
  addModalManagerId,
  deleteTarget,
  editTarget,
  showUnlinked,
  showSetupModal,
  showCleanupModal,
  showAddDepartmentModal,
  showAddPositionModal,
  posForm,
  setPosForm,
  positionSaving,
  onAddEmployee,
  onDeleteEmployee,
  onEditEmployee,
  onLinkEmployee,
  onAddDepartment,
  onSetupHierarchy,
  onCleanupDuplicates,
  onCloseSelectedNode,
  onCloseAddModal,
  onCloseDeleteModal,
  onCloseEditModal,
  onCloseUnlinkedPanel,
  onCloseSetupModal,
  onCloseCleanupModal,
  onCloseAddDepartmentModal,
  onAddPosition,
  onCloseAddPositionModal,
  onDetailAddChild,
  onDetailDelete,
  onDetailEdit,
}: HierarchyModalsProps) => {
  const handleDetailPanelButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
  };

  return (
  <>
    <AnimatePresence>
      {selectedNode && !deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCloseSelectedNode}
        >
          <button onClick={handleDetailPanelButtonClick}>
            <Suspense fallback={null}>
              <DetailPanel
                node={selectedNode}
                orgTree={orgTree}
                onClose={onCloseSelectedNode}
                onAddChild={onDetailAddChild}
                onDelete={onDetailDelete}
                onEdit={onDetailEdit}
              />
            </Suspense>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showAddModal && (
        <Suspense fallback={null}>
          <AddEmployeeModal
            allNodes={allNodes}
            departments={departments}
            preselectedManagerId={addModalManagerId}
            onAdd={onAddEmployee}
            onClose={onCloseAddModal}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showAddDepartmentModal && (
        <Suspense fallback={null}>
          <AddDepartmentModal
            departmentColors={deptColors}
            onAdd={onAddDepartment}
            onClose={onCloseAddDepartmentModal}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showAddPositionModal && (
        <Suspense fallback={null}>
          <PositionFormModal
            editingPosition={null}
            posForm={posForm}
            setPosForm={setPosForm}
            dbDepartments={dbDepartments}
            onClose={onCloseAddPositionModal}
            onConfirm={onAddPosition}
            saving={positionSaving}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {deleteTarget && (
        <DeleteConfirmModal
          node={deleteTarget}
          orgTree={orgTree}
          onDelete={onDeleteEmployee}
          onClose={onCloseDeleteModal}
        />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {editTarget && (
        <Suspense fallback={null}>
          <EditEmployeeModal
            node={editTarget}
            allNodes={allNodes}
            departments={departments}
            onSave={onEditEmployee}
            onClose={onCloseEditModal}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showUnlinked && unlinkedEmps.length > 0 && (
        <Suspense fallback={null}>
          <UnlinkedPanel
            employees={unlinkedEmps}
            allNodes={allNodes}
            onLink={onLinkEmployee}
            onClose={onCloseUnlinkedPanel}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showSetupModal && (
        <Suspense fallback={null}>
          <SetupHierarchyModal
            dbEmployees={dbEmployees}
            saving={saving}
            onClose={onCloseSetupModal}
            onSetup={onSetupHierarchy}
          />
        </Suspense>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showCleanupModal && (
        <Suspense fallback={null}>
          <CleanupDuplicatesModal
            dbEmployees={dbEmployees}
            saving={saving}
            onClose={onCloseCleanupModal}
            onCleanup={onCleanupDuplicates}
          />
        </Suspense>
      )}
    </AnimatePresence>
  </>
  );
};

export default memo(HierarchyModals);
