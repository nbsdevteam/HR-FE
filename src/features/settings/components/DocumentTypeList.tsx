import { arabicSource } from "@/i18n/source";
import type { DbDocumentType } from "@/shared/hooks";
import DocumentTypeListItem from "./DocumentTypeListItem";

type TDocumentTypeListProps = {
  documentTypes: DbDocumentType[];
  loading: boolean;
  onToggleActive: (documentType: DbDocumentType) => void;
  onDelete: (documentTypeId: string) => void;
};

const DocumentTypeList = ({
  documentTypes,
  loading,
  onToggleActive,
  onDelete,
}: TDocumentTypeListProps) => {
  if (loading) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        {arabicSource("common.loading")}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {documentTypes?.map((documentType) => (
        <DocumentTypeListItem
          key={documentType.id}
          documentType={documentType}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DocumentTypeList;
