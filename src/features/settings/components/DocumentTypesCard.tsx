import { useCallback } from "react";
import { motion } from "motion/react";
import { FileCheck, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useDocumentTypes, type DbDocumentType } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useDocumentTypeManagement } from "../hooks/useDocumentTypeManagement";
import TypeList from "./TypeList";
import NewDocTypeForm from "./NewDocTypeForm";

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
    types: documentTypes,
    loading: documentTypesLoading,
    refetch: refetchDocumentTypes,
  } = useDocumentTypes();
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
            <FileCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">
              {arabicSource("settings.types_of_documents")}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {arabicSource(
                "settings.manage_the_types_of_documents_and_documents_required",
              )}
            </p>
          </div>
        </div>
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
      </div>

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
    </motion.div>
  );
};

export default DocumentTypesCard;
