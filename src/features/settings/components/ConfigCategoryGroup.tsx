import { memo } from "react";
import type { DbConfiguration } from "@/shared/hooks";
import type { ConfigValue } from "../types";
import CategoryGroupHeader from "./CategoryGroupHeader";
import ConfigRow from "./ConfigRow";

interface IConfigCategoryGroupProps {
  category: string;
  configs: DbConfiguration[];
  configEdits: Record<string, ConfigValue>;
  onEdit: (configId: string, value: ConfigValue) => void;
  onSave: (configId: string, value: ConfigValue) => void;
}

const ConfigCategoryGroup = ({
  category,
  configs,
  configEdits,
  onEdit,
  onSave,
}: IConfigCategoryGroupProps) => (
  <div>
    <CategoryGroupHeader category={category} />
    <div className="space-y-3">
      {configs?.map((config) => {
        const edited = configEdits[config.id];
        const hasChanged = edited !== undefined;
        return (
          <ConfigRow
            key={config.id}
            config={config}
            currentValue={hasChanged ? edited : config.config_value}
            hasChanged={hasChanged}
            onEdit={onEdit}
            onSave={onSave}
          />
        );
      })}
    </div>
  </div>
);

export default memo(ConfigCategoryGroup);
