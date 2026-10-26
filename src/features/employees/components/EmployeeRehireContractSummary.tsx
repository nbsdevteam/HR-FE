import type { DbEmployeeContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type ContractTypeOption = { value: string; label: string };

type EmployeeRehireContractSummaryProps = {
  contract: DbEmployeeContract;
  contractTypeOptions: readonly ContractTypeOption[];
};

/** The contract a rehire created, shown once the restore succeeds. */
const EmployeeRehireContractSummary = ({ contract, contractTypeOptions }: EmployeeRehireContractSummaryProps) => {
  const typeLabel = contractTypeOptions.find(option => option.value === contract.contract_type_id)?.label ?? "—";

  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-2" style={{ fontSize: 13 }}>
      <p className="text-muted-foreground">{arabicSource("employees.rehire_success_message")}</p>
      <dl className="grid grid-cols-2 gap-2">
        <dt className="text-muted-foreground">{arabicSource("common.contract_number")}</dt>
        <dd className="text-foreground" dir="ltr">{contract.contract_number || "—"}</dd>
        <dt className="text-muted-foreground">{arabicSource("lifecycle.contract_type")}</dt>
        <dd className="text-foreground">{typeLabel}</dd>
        <dt className="text-muted-foreground">{arabicSource("common.start_date")}</dt>
        <dd className="text-foreground" dir="ltr">{contract.start_date}</dd>
        <dt className="text-muted-foreground">{arabicSource("common.end_date")}</dt>
        <dd className="text-foreground" dir="ltr">{contract.end_date || arabicSource("common.not_specified")}</dd>
      </dl>
    </div>
  );
};

export default EmployeeRehireContractSummary;
