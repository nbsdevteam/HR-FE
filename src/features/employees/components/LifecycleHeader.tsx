import { arabicSource } from "@/i18n/source";

const LifecycleHeader = () => (
  <div>
    <h1 className="text-gradient-gold">{arabicSource("common.employee_life_cycle")}</h1>
    <p className="text-muted-foreground mt-1">{arabicSource("lifecycle.contracts_documents_and_termination_management")}</p>
  </div>
);

export default LifecycleHeader;
