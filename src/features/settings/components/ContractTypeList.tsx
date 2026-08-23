import { arabicSource } from "@/i18n/source";
import type { DbContractType } from "@/shared/hooks";
import ContractTypeListItem from "./ContractTypeListItem";

interface IContractTypeListProps {
  contractTypes: DbContractType[];
  loading: boolean;
  onToggleActive: (contractType: DbContractType) => void;
  onDelete: (contractTypeId: string) => void;
}

const ContractTypeList = ({
  contractTypes,
  loading,
  onToggleActive,
  onDelete,
}: IContractTypeListProps) => {
  const handleToggleActiveClick = (contractType: DbContractType) => (): void => {
    onToggleActive(contractType);
  };

  const handleDeleteClick = (contractTypeId: string) => (): void => {
    onDelete(contractTypeId);
  };

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        {arabicSource("common.loading")}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {contractTypes?.map((contractType) => (
        <ContractTypeListItem
          key={contractType.id}
          contractType={contractType}
          onToggleActive={handleToggleActiveClick(contractType)}
          onDelete={handleDeleteClick(contractType.id)}
        />
      ))}
    </div>
  );
};

export default ContractTypeList;
