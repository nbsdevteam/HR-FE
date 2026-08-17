import type { DbConfiguration } from "@/shared/hooks";
import { categoryLabels } from "../constants/settings";
import ConfigRow from "./ConfigRow";

type ConfigCategoryGroupProps = {
  category: string;
  configs: DbConfiguration[];
  configEdits: Record<string, any>;
  onEdit: (configId: string, value: any) => void;
  onSave: (configId: string, value: any) => void;
};

const ConfigCategoryGroup = ({ category, configs, configEdits, onEdit, onSave }: ConfigCategoryGroupProps) => (
  <div>
    <div className="flex items-center gap-3 mb-3 pb-2 border-s-4 border-primary ps-3">
      <h4 className="text-foreground font-medium">{categoryLabels[category] || category}</h4>
    </div>
    <div className="space-y-3">
      {configs.map((config) => {
        const currentValue = configEdits[config.id] !== undefined ? configEdits[config.id] : config.config_value;
        const hasChanged = configEdits[config.id] !== undefined;
        return (
          <ConfigRow
            key={config.id}
            config={config}
            currentValue={currentValue}
            hasChanged={hasChanged}
            onEdit={(value) => onEdit(config.id, value)}
            onSave={(value) => onSave(config.id, value)}
          />
        );
      })}
    </div>
  </div>
);

export default ConfigCategoryGroup;
