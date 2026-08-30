import { useCallback } from "react";
import { motion } from "motion/react";
import { Briefcase, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbContractType } from "@/shared/hooks";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { cardCls } from "../styles";
import { useContractTypeManagement } from "../hooks/useContractTypeManagement";
import TypeList from "./TypeList";
import NewContractTypeForm from "./NewContractTypeForm";

const contractTypeDescriptionLine = (contractType: DbContractType): string =>
  `${
    contractType.default_duration_months
      ? `${contractType.default_duration_months} ${arabicSource("settings.month")}`
      : arabicSource("common.not_specified")
  } ${arabicSource("settings.experiment")} ${contractType.probation_days} ${arabicSource("settings.day_notice")} ${contractType.notice_period_days} ${arabicSource("common.days_2")}${
    contractType.is_renewable ? " " + arabicSource("settings.renewable") : ""
  }`;

type TContractTypesCardProps = {
  showToast: (message: string) => void;
};

const ContractTypesCard = ({ showToast }: TContractTypesCardProps) => {
  const {
    contractTypes,
    loading: contractTypesLoading,
    refetch: refetchContractTypes,
  } = useSettingsBootstrap();
  const {
    showNewContractTypeForm,
    setShowNewContractTypeForm,
    newContractType,
    updateNewContractType,
    createContractTypeEntry,
    toggleContractTypeActive,
    deleteContractTypeEntry,
  } = useContractTypeManagement(refetchContractTypes, showToast);

  const handleToggleNewContractTypeForm = useCallback((): void => {
    setShowNewContractTypeForm(!showNewContractTypeForm);
  }, [setShowNewContractTypeForm, showNewContractTypeForm]);

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
            <h3 className="text-foreground">
              {arabicSource("settings.types_of_contracts")}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {arabicSource(
                "settings.managing_employment_contract_types_and_settings",
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleNewContractTypeForm}
          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
        >
          {showNewContractTypeForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {showNewContractTypeForm && (
        <NewContractTypeForm
          form={newContractType}
          onFieldChange={updateNewContractType}
          onSave={createContractTypeEntry}
        />
      )}

      <TypeList
        items={contractTypes}
        loading={contractTypesLoading}
        descriptionLine={contractTypeDescriptionLine}
        onToggleActive={toggleContractTypeActive}
        onDelete={deleteContractTypeEntry}
      />
    </motion.div>
  );
};

export default ContractTypesCard;
