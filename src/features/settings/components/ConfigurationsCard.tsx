import { useMemo } from "react";
import { Settings2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useConfigEdits } from "../hooks/useConfigEdits";
import { groupByCategory } from "../utils/groupByCategory";
import ConfigCategoryGroup from "./ConfigCategoryGroup";
import SettingsSectionCard from "./SettingsSectionCard";

interface IConfigurationsCardProps {
  showToast: (message: string) => void;
}

const ConfigurationsCard = ({ showToast }: IConfigurationsCardProps) => {
  const {
    configs,
    loading: configsLoading,
    refetch: refetchConfigs,
  } = useSettingsBootstrap();
  const { configEdits, setConfigEdit, saveConfigValue } = useConfigEdits(
    refetchConfigs,
    showToast,
  );

  const groupedConfigs = useMemo(
    () => groupByCategory(configs, "general"),
    [configs],
  );

  return (
    <SettingsSectionCard
      icon={Settings2}
      title={arabicSource("settings.rules_and_settings")}
      description={arabicSource(
        "settings.all_editable_values_applied_directly_to_calculations",
      )}
      delay={0.3}
    >
      {configsLoading ? (
        <div className="text-muted-foreground text-center py-6">
          {arabicSource("common.loading")}
        </div>
      ) : !configs || Object.keys(groupedConfigs).length === 0 ? (
        <div
          className="text-muted-foreground text-center py-3"
          style={{ fontSize: 13 }}
        >
          {arabicSource("settings.no_settings_run_the_relay_first")}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            <ConfigCategoryGroup
              key={category}
              category={category}
              configs={categoryConfigs}
              configEdits={configEdits}
              onEdit={setConfigEdit}
              onSave={saveConfigValue}
            />
          ))}
        </div>
      )}
    </SettingsSectionCard>
  );
};

export default ConfigurationsCard;
