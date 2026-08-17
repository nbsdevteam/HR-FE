import { useMemo } from "react";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useSystemModules } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useSystemModuleToggle } from "../hooks/useSystemModuleToggle";
import { groupByCategory } from "../utils/groupByCategory";
import ModuleCategoryGroup from "./ModuleCategoryGroup";

type SystemModulesCardProps = {
  showToast: (message: string) => void;
};

const SystemModulesCard = ({ showToast }: SystemModulesCardProps) => {
  const { modules: sysModules, loading: modulesLoading, refetch: refetchModules } = useSystemModules();
  const { toggleModule } = useSystemModuleToggle(refetchModules, showToast);

  const groupedModules = useMemo(() => groupByCategory(sysModules, "system"), [sysModules]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`${cardCls} lg:col-span-2`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">{arabicSource("settings.units_and_features")}</h3>
            <p className="text-muted-foreground text-sm mt-1">{arabicSource("settings.activate_or_disable_any_feature_in_the_system_disabled_features")}</p>
          </div>
        </div>
      </div>

      {modulesLoading ? (
        <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
      ) : !sysModules || Object.keys(groupedModules).length === 0 ? (
        <div className="text-muted-foreground text-center py-3" style={{ fontSize: 13 }}>{arabicSource("settings.no_units_turn_on_the_relay_first")}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <ModuleCategoryGroup key={category} category={category} modules={modules} onToggleModule={toggleModule} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SystemModulesCard;
