import { arabicSource } from "@/i18n/source";
import LoadingState from "@/shared/components/LoadingState";

const PoliciesLoadingState = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-gradient-gold">{arabicSource("common.policies_and_procedures")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("common.internal_policies_and_systems_manual")}</p>
      </div>
    </div>
    <LoadingState variant="compact" message={arabicSource("common.loading")} />
  </div>
);

export default PoliciesLoadingState;
