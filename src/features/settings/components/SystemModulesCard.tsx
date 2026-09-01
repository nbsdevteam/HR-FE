import { useMemo } from "react";
import { Zap } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useSystemModuleToggle } from "../hooks/useSystemModuleToggle";
import { groupByCategory } from "../utils/groupByCategory";
import ModuleCategoryGroup from "./ModuleCategoryGroup";
import SettingsSectionCard from "./SettingsSectionCard";

type TSystemModulesCardProps = {
  showToast: (message: string) => void;
};

const SystemModulesCard = ({ showToast }: TSystemModulesCardProps) => {
  const {
    modules: sysModules,
    loading: modulesLoading,
    refetch: refetchModules,
  } = useSettingsBootstrap();
  const { toggleModule } = useSystemModuleToggle(refetchModules, showToast);

  const groupedModules = useMemo(
    () => groupByCategory(sysModules, "system"),
    [sysModules],
  );

  return (
    <SettingsSectionCard
      icon={Zap}
      title={arabicSource("settings.units_and_features")}
      description={arabicSource(
        "settings.activate_or_disable_any_feature_in_the_system_disabled_features",
      )}
      delay={0.2}
    >
      {modulesLoading ? (
        <div className="text-muted-foreground text-center py-6">
          {arabicSource("common.loading")}
        </div>
      ) : !sysModules || Object.keys(groupedModules).length === 0 ? (
        <div
          className="text-muted-foreground text-center py-3"
          style={{ fontSize: 13 }}
        >
          {arabicSource("settings.no_units_turn_on_the_relay_first")}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <ModuleCategoryGroup
              key={category}
              category={category}
              modules={modules}
              onToggleModule={toggleModule}
            />
          ))}
        </div>
      )}
    </SettingsSectionCard>
  );
};

export default SystemModulesCard;
