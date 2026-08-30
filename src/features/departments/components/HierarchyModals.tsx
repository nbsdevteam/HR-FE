import { lazy, memo, Suspense } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence } from "motion/react";
import type { DbEmployee, DbDepartment } from "@/shared/hooks";
import type { OrgNode } from "../types";
import DeleteConfirmModal from "./DeleteConfirmModal";
import DetailPanelModal from "./DetailPanelModal";
import type { PositionFormState } from "./PositionFormModal";

const SetupHierarchyModal = lazy(() => import("./SetupHierarchyModal"));
const CleanupDuplicatesModal = lazy(() => import("./CleanupDuplicatesModal"));
const UnlinkedPanel = lazy(() => import("./UnlinkedPanel"));
const EditEmployeeModal = lazy(() => import("./EditEmployeeModal"));
const AddDepartmentModal = lazy(() => import("./AddDepartmentModal"));
const PositionFormModal = lazy(() => import("./PositionFormModal"));
const ChangeManagerModal = lazy(() => import("./ChangeManagerModal"));

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
  deleteTarget: OrgNode | null;
  editTarget: OrgNode | null;
  changeManagerTarget: OrgNode | null;
  showUnlinked: boolean;
  showSetupModal: boolean;
  showCleanupModal: boolean;
  showAddDepartmentModal: boolean;
  showAddPositionModal: boolean;
  posForm: PositionFormState;
  setPosForm: Dispatch<SetStateAction<PositionFormState>>;
  positionSaving: boolean;
  onDeleteEmployee: (node: OrgNode, reparent: boolean) => Promise<void>;
  onEditEmployee: (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => Promise<void>;
  onLinkEmployee: (empDbId: string, managerDbId: string) => Promise<void>;
  onChangeManagerConfirm: (empDbId: string, managerDbId: string) => Promise<void>;
  onAddDepartment: (name: string, color: string) => Promise<void>;
  onSetupHierarchy: () => Promise<void>;
  onCleanupDuplicates: () => Promise<void>;
  onCloseSelectedNode: () => void;
  onCloseDeleteModal: () => void;
  onCloseEditModal: () => void;
  onCloseUnlinkedPanel: () => void;
  onCloseSetupModal: () => void;
  onCloseCleanupModal: () => void;
  onCloseAddDepartmentModal: () => void;
  onCloseChangeManagerModal: () => void;
  onAddPosition: () => Promise<void>;
  onCloseAddPositionModal: () => void;
  onDetailDelete: (node: OrgNode) => void;
  onDetailEdit: (node: OrgNode) => void;
  onDetailChangeManager: (node: OrgNode) => void;
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
  deleteTarget,
  editTarget,
  changeManagerTarget,
  showUnlinked,
  showSetupModal,
  showCleanupModal,
  showAddDepartmentModal,
  showAddPositionModal,
  posForm,
  setPosForm,
  positionSaving,
  onDeleteEmployee,
  onEditEmployee,
  onLinkEmployee,
  onChangeManagerConfirm,
  onAddDepartment,
  onSetupHierarchy,
  onCleanupDuplicates,
  onCloseSelectedNode,
  onCloseDeleteModal,
  onCloseEditModal,
  onCloseUnlinkedPanel,
  onCloseSetupModal,
  onCloseCleanupModal,
  onCloseAddDepartmentModal,
  onCloseChangeManagerModal,
  onAddPosition,
  onCloseAddPositionModal,
  onDetailDelete,
  onDetailEdit,
  onDetailChangeManager,
}: HierarchyModalsProps) => (
  <>
    <AnimatePresence>
      {selectedNode && !deleteTarget && (
        <DetailPanelModal
          node={selectedNode}
          orgTree={orgTree}
          onClose={onCloseSelectedNode}
          onDelete={onDetailDelete}
          onEdit={onDetailEdit}
          onChangeManager={onDetailChangeManager}
        />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {changeManagerTarget && (
        <Suspense fallback={null}>
          <ChangeManagerModal
            node={changeManagerTarget}
            orgTree={orgTree}
            allNodes={allNodes}
            saving={saving}
            onConfirm={onChangeManagerConfirm}
            onClose={onCloseChangeManagerModal}
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

export default memo(HierarchyModals);
