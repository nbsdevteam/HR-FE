import { motion, AnimatePresence } from "motion/react";
import { Laptop } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Custody } from "../types";
import EmployeeAddCustodyForm from "./EmployeeAddCustodyForm";
import EmployeeCustodyCard from "./EmployeeCustodyCard";
import TabAddToggleHeader from "./shared/TabAddToggleHeader";
import TabShellEmptyState from "./shared/TabShellEmptyState";

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string };

type EmployeeCustodiesTabProps = {
  custodies: Custody[];
  isEditing: boolean;
  showAddCustody: boolean;
  newCustody: NewCustody;
  onToggleAddCustody: () => void;
  onNewCustodyChange: (patch: Partial<NewCustody>) => void;
  onConfirmAddCustody: () => void;
  onCancelAddCustody: () => void;
  onDeleteCustody: (id: number) => void;
};

const EmployeeCustodiesTab = ({
  custodies,
  isEditing,
  showAddCustody,
  newCustody,
  onToggleAddCustody,
  onNewCustodyChange,
  onConfirmAddCustody,
  onCancelAddCustody,
  onDeleteCustody,
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

    {custodies.length > 0 ? custodies.map((custody) => (
      <EmployeeCustodyCard key={custody.id} custody={custody} isEditing={isEditing} onDelete={onDeleteCustody} />
    )) : !showAddCustody && (
      <TabShellEmptyState icon={Laptop} message={arabicSource("shared.there_are_no_receivables_recorded")} />
    )}
  </motion.div>
);

export default EmployeeCustodiesTab;
