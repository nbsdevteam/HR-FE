import { motion, AnimatePresence } from "motion/react";
import { Laptop } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { LoadingState } from "@/shared/components";
import type { Custody, CustodyStatus } from "../types";
import EmployeeAddCustodyForm from "./EmployeeAddCustodyForm";
import EmployeeCustodyCard from "./EmployeeCustodyCard";
import TabAddToggleHeader from "./shared/TabAddToggleHeader";
import TabShellEmptyState from "./shared/TabShellEmptyState";

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string; status: CustodyStatus; notes: string };

type EmployeeCustodiesTabProps = {
  custodies: Custody[];
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  showAddCustody: boolean;
  newCustody: NewCustody;
  onToggleAddCustody: () => void;
  onNewCustodyChange: (patch: Partial<NewCustody>) => void;
  onConfirmAddCustody: () => void;
  onCancelAddCustody: () => void;
  onDeleteCustody: (id: string) => void;
  onUpdateCustody: (id: string, patch: Partial<Pick<Custody, "status" | "returnDate">>) => void;
};

const EmployeeCustodiesTab = ({
  custodies,
  loading,
  error,
  isEditing,
  showAddCustody,
  newCustody,
  onToggleAddCustody,
  onNewCustodyChange,
  onConfirmAddCustody,
  onCancelAddCustody,
  onDeleteCustody,
  onUpdateCustody,
}: EmployeeCustodiesTabProps) => (
  <motion.div
    key="custodies"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
    className="px-6 py-5 space-y-4"
  >
    <TabAddToggleHeader
      description={arabicSource("shared.covenant_and_items_received_by_employee")}
      isEditing={isEditing}
      addLabel={arabicSource("common.addition")}
      onToggle={onToggleAddCustody}
    />

    {error && (
      <div
        className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
        style={{ fontSize: 13 }}
      >
        {arabicSource("shared.error_saving")} {error}
      </div>
    )}

    <AnimatePresence>
      {showAddCustody && isEditing && (
        <EmployeeAddCustodyForm
          newCustody={newCustody}
          onChange={onNewCustodyChange}
          onConfirm={onConfirmAddCustody}
          onCancel={onCancelAddCustody}
        />
      )}
    </AnimatePresence>

    {loading ? (
      <LoadingState variant="compact" message={arabicSource("common.loading")} />
    ) : custodies.length > 0 ? (
      custodies.map((custody) => (
        <EmployeeCustodyCard
          key={custody.id}
          custody={custody}
          isEditing={isEditing}
          onDelete={onDeleteCustody}
          onUpdate={onUpdateCustody}
        />
      ))
    ) : (
      !showAddCustody && (
        <TabShellEmptyState icon={Laptop} message={arabicSource("shared.there_are_no_receivables_recorded")} />
      )
    )}
  </motion.div>
);

export default EmployeeCustodiesTab;
