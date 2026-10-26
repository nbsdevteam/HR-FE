import type { LifecycleContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import EmployeeLifecycleContractRow from "./EmployeeLifecycleContractRow";

type EmployeeLifecycleContractsProps = {
  current: LifecycleContract | null;
  history: LifecycleContract[];
};

/** The current contract, then the history (the backend lists the current one in both, so it is skipped there). */
const EmployeeLifecycleContracts = ({ current, history }: EmployeeLifecycleContractsProps) => {
  const earlier = current ? history.filter(contract => contract.id !== current.id) : history;

  return (
    <section className="rounded-xl border border-border/40 bg-card/30 p-4" data-lifecycle-contracts>
      <h4 className="text-foreground mb-3" style={{ fontSize: 14 }}>{arabicSource("lifecycle.contracts")}</h4>
      {current ? (
        <ul>
          <EmployeeLifecycleContractRow contract={current} />
        </ul>
      ) : (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.lifecycle_no_contract")}</p>
      )}
      {earlier.length > 0 && (
        <>
          <h5 className="text-muted-foreground mt-4 mb-1" style={{ fontSize: 12 }}>{arabicSource("employees.lifecycle_contract_history")}</h5>
          <ul>
            {earlier.map(contract => (
              <EmployeeLifecycleContractRow key={contract.id} contract={contract} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default EmployeeLifecycleContracts;
