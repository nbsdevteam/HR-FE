import { motion } from "motion/react";
import { FileCheck, Plus, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useDocumentTypes } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useDocumentTypeManagement } from "../hooks/useDocumentTypeManagement";
import { DocumentTypeList } from "./DocumentTypeList";
import { NewDocTypeForm } from "./NewDocTypeForm";

type DocumentTypesCardProps = {
  showToast: (message: string) => void;
};

export const DocumentTypesCard = ({ showToast }: DocumentTypesCardProps) => {
  const { types: documentTypes, loading: documentTypesLoading, refetch: refetchDocumentTypes } = useDocumentTypes();
  const {
    showNewDocTypeForm, setShowNewDocTypeForm,
    newDocType, updateNewDocType,
    createDocumentTypeEntry, toggleDocumentTypeActive, deleteDocumentTypeEntry,
  } = useDocumentTypeManagement(refetchDocumentTypes, showToast);

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
            <h3 className="text-foreground">{arabicSource("settings.types_of_documents")}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{arabicSource("settings.manage_the_types_of_documents_and_documents_required")}</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewDocTypeForm(!showNewDocTypeForm)}
          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
        >
          {showNewDocTypeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showNewDocTypeForm && (
        <NewDocTypeForm form={newDocType} onFieldChange={updateNewDocType} onSave={createDocumentTypeEntry} />
      )}

      <DocumentTypeList
        documentTypes={documentTypes}
        loading={documentTypesLoading}
        onToggleActive={toggleDocumentTypeActive}
        onDelete={deleteDocumentTypeEntry}
      />
    </motion.div>
  );
};
