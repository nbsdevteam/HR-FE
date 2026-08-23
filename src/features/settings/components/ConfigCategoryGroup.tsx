import type { DbConfiguration } from "@/shared/hooks";
import CategoryGroupHeader from "./CategoryGroupHeader";
import ConfigRow from "./ConfigRow";
import { memo } from "react";

interface IConfigCategoryGroupProps {
  category: string;
  configs: DbConfiguration[];
  configEdits: Record<string, any>;
  onEdit: (configId: string, value: any) => void;
  onSave: (configId: string, value: any) => void;
}

const ConfigCategoryGroup = ({
  category,
  configs,
  configEdits,
  onEdit,
  onSave,
}: IConfigCategoryGroupProps) => {
  const handleEdit = (configId: string) => (value: any): void => {
    onEdit(configId, value);
  };

  const handleSave = (configId: string) => (value: any): void => {
    onSave(configId, value);
  };

  return (
    <div>
      <CategoryGroupHeader category={category} />
      <div className="space-y-3">
        {configs?.map((config) => {
          const currentValue =
            configEdits[config.id] !== undefined
              ? configEdits[config.id]
              : config.config_value;
          const hasChanged = configEdits[config.id] !== undefined;
          return (
            <ConfigRow
              key={config.id}
              config={config}
              currentValue={currentValue}
              hasChanged={hasChanged}
              onEdit={handleEdit(config.id)}
              onSave={handleSave(config.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(ConfigCategoryGroup);
