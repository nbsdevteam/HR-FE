import { useCallback } from "react";
import { FileCheck, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbDocumentType } from "@/shared/hooks";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useDocumentTypeManagement } from "../hooks/useDocumentTypeManagement";
import TypeList from "./TypeList";
import NewDocTypeForm from "./NewDocTypeForm";
import SettingsSectionCard from "./SettingsSectionCard";

const documentTypeDescriptionLine = (documentType: DbDocumentType): string =>
  `${
    documentType.has_expiry
      ? `${arabicSource("settings.warning_before")} ${documentType.expiry_warning_days} ${arabicSource("common.days_2")}`
      : arabicSource("settings.without_ending")
  }${documentType.is_required ? " " + arabicSource("settings.mandatory") : ""}`;

type TDocumentTypesCardProps = {
  showToast: (message: string) => void;
};

const DocumentTypesCard = ({ showToast }: TDocumentTypesCardProps) => {
  const {
    documentTypes,
    loading: documentTypesLoading,
    refetch: refetchDocumentTypes,
  } = useSettingsBootstrap();
  const {
    showNewDocTypeForm,
    newDocType,
    setShowNewDocTypeForm,
    updateNewDocType,
    createDocumentTypeEntry,
    toggleDocumentTypeActive,
    deleteDocumentTypeEntry,
  } = useDocumentTypeManagement(refetchDocumentTypes, showToast);

  const handleToggleNewDocTypeForm = useCallback((): void => {
    setShowNewDocTypeForm(!showNewDocTypeForm);
  }, [setShowNewDocTypeForm, showNewDocTypeForm]);

  const actions = (
    <button
      onClick={handleToggleNewDocTypeForm}
      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
    >
      {showNewDocTypeForm ? (
        <X className="w-4 h-4" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <SettingsSectionCard
      icon={FileCheck}
      title={arabicSource("settings.types_of_documents")}
      description={arabicSource(
        "settings.manage_the_types_of_documents_and_documents_required",
      )}
      actions={actions}
      delay={0.1}
    >
      {showNewDocTypeForm && (
        <NewDocTypeForm
          form={newDocType}
          onFieldChange={updateNewDocType}
          onSave={createDocumentTypeEntry}
        />
      )}

      <TypeList
        items={documentTypes}
        loading={documentTypesLoading}
        descriptionLine={documentTypeDescriptionLine}
        onToggleActive={toggleDocumentTypeActive}
        onDelete={deleteDocumentTypeEntry}
      />
    </SettingsSectionCard>
  );
};

export default DocumentTypesCard;
