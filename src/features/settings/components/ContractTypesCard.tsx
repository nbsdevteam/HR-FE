import { useCallback } from "react";
import { Briefcase, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbContractType } from "@/shared/hooks";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useContractTypeManagement } from "../hooks/useContractTypeManagement";
import TypeList from "./TypeList";
import NewContractTypeForm from "./NewContractTypeForm";
import SettingsSectionCard from "./SettingsSectionCard";

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

  const actions = (
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
  );

  return (
    <SettingsSectionCard
      icon={Briefcase}
      title={arabicSource("settings.types_of_contracts")}
      description={arabicSource(
        "settings.managing_employment_contract_types_and_settings",
      )}
      actions={actions}
      delay={0.1}
    >
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
    </SettingsSectionCard>
  );
};

export default ContractTypesCard;
