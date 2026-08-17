import { arabicSource } from "@/i18n/source";
import type { DbContractType } from "@/shared/hooks";
import { ContractTypeListItem } from "./ContractTypeListItem";

type ContractTypeListProps = {
  contractTypes: DbContractType[];
  loading: boolean;
  onToggleActive: (contractType: DbContractType) => void;
  onDelete: (contractTypeId: string) => void;
};

export const ContractTypeList = ({ contractTypes, loading, onToggleActive, onDelete }: ContractTypeListProps) => {
  if (loading) {
    return <p className="text-muted-foreground text-sm text-center py-4">{arabicSource("common.loading")}</p>;
  }
  return (
    <div className="space-y-2">
      {contractTypes.map((contractType) => (
        <ContractTypeListItem
          key={contractType.id}
          contractType={contractType}
          onToggleActive={() => onToggleActive(contractType)}
          onDelete={() => onDelete(contractType.id)}
        />
      ))}
    </div>
  );
};
