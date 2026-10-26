import { StatusBadge } from "@/shared/components";
import type { LifecycleContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { defaultLifecycleStatusColors, defaultLifecycleStatusLabels } from "../styles/lifecycle";

type EmployeeLifecycleContractRowProps = {
  contract: LifecycleContract;
};

/** One contract on the lifecycle summary — its status comes from the backend, never recomputed here. */
const EmployeeLifecycleContractRow = ({ contract }: EmployeeLifecycleContractRowProps) => (
  <li className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border/20 last:border-b-0" style={{ fontSize: 13 }}>
    <div>
      <p className="text-foreground" dir="auto">{contract.contract_type_name || arabicSource("lifecycle.contract_type")}</p>
      <p className="text-muted-foreground" style={{ fontSize: 12 }} dir="ltr">
        {contract.contract_number ? `${contract.contract_number} · ` : ""}
        {contract.start_date} → {contract.end_date || arabicSource("common.not_specified")}
      </p>
    </div>
    <StatusBadge colorClassName={defaultLifecycleStatusColors[contract.status] || ""}>
      {defaultLifecycleStatusLabels[contract.status] || contract.status}
    </StatusBadge>
  </li>
);

export default EmployeeLifecycleContractRow;
