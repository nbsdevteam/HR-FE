import { useMemo } from "react";
import { motion } from "motion/react";
import { Settings2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useConfigurations } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useConfigEdits } from "../hooks/useConfigEdits";
import { groupByCategory } from "../utils/groupByCategory";
import ConfigCategoryGroup from "./ConfigCategoryGroup";

interface IConfigurationsCardProps {
  showToast: (message: string) => void;
}

const ConfigurationsCard = ({ showToast }: IConfigurationsCardProps) => {
  const {
    configs,
    loading: configsLoading,
    refetch: refetchConfigs,
  } = useConfigurations();
  const { configEdits, setConfigEdit, saveConfigValue } = useConfigEdits(
    refetchConfigs,
    showToast,
  );

  const groupedConfigs = useMemo(
    () => groupByCategory(configs, "general"),
    [configs],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${cardCls} lg:col-span-2`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">
              {arabicSource("settings.rules_and_settings")}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {arabicSource(
                "settings.all_editable_values_applied_directly_to_calculations",
              )}
            </p>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
};

export default ConfigurationsCard;
