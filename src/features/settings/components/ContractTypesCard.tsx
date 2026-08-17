import { motion } from "motion/react";
import { Briefcase, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useContractTypes } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useContractTypeManagement } from "../hooks/useContractTypeManagement";
import { ContractTypeList } from "./ContractTypeList";
import { NewContractTypeForm } from "./NewContractTypeForm";

type ContractTypesCardProps = {
  showToast: (message: string) => void;
};

export const ContractTypesCard = ({ showToast }: ContractTypesCardProps) => {
  const { types: contractTypes, loading: contractTypesLoading, refetch: refetchContractTypes } = useContractTypes();
  const {
    showNewContractTypeForm, setShowNewContractTypeForm,
    newContractType, updateNewContractType,
    createContractTypeEntry, toggleContractTypeActive, deleteContractTypeEntry,
  } = useContractTypeManagement(refetchContractTypes, showToast);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cardCls}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">{arabicSource("settings.types_of_contracts")}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{arabicSource("settings.managing_employment_contract_types_and_settings")}</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewContractTypeForm(!showNewContractTypeForm)}
          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
        >
          {showNewContractTypeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showNewContractTypeForm && (
        <NewContractTypeForm form={newContractType} onFieldChange={updateNewContractType} onSave={createContractTypeEntry} />
      )}

      <ContractTypeList
        contractTypes={contractTypes}
        loading={contractTypesLoading}
        onToggleActive={toggleContractTypeActive}
        onDelete={deleteContractTypeEntry}
      />
    </motion.div>
  );
};
