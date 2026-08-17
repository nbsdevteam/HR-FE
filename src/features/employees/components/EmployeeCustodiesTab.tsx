import { motion, AnimatePresence } from "motion/react";
import { Laptop, PlusCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Custody } from "../types";
import EmployeeAddCustodyForm from "./EmployeeAddCustodyForm";
import EmployeeCustodyCard from "./EmployeeCustodyCard";

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
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>
        {arabicSource("shared.covenant_and_items_received_by_employee")}
      </p>
      {isEditing && (
        <button
          onClick={onToggleAddCustody}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          <PlusCircle className="w-4 h-4" />
          {arabicSource("common.addition")}
        </button>
      )}
    </div>

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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Laptop className="w-10 h-10 mb-3 opacity-30" />
        <p style={{ fontSize: 14 }}>{arabicSource("shared.there_are_no_receivables_recorded")}</p>
      </div>
    )}
  </motion.div>
);

export default EmployeeCustodiesTab;
