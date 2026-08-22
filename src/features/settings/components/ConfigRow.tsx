import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbConfiguration } from "@/shared/hooks";
import SettingsToggle from "./SettingsToggle";

interface IConfigRowProps {
  config: DbConfiguration;
  currentValue: any;
  hasChanged: boolean;
  onEdit: (value: any) => void;
  onSave: (value: any) => void;
}

const ConfigRow = ({
  config,
  currentValue,
  hasChanged,
  onEdit,
  onSave,
}: IConfigRowProps) => (
  <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
    <div className="flex-1">
      <p className="text-foreground text-sm">{config.label_ar}</p>
      {config.description_ar && (
        <p className="text-muted-foreground text-xs mt-1">
          {config.description_ar}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {config.value_type === "boolean" ? (
        <SettingsToggle
          on={currentValue === true || currentValue === "true"}
          onClick={() => {
            const newVal = !(currentValue === true || currentValue === "true");
            onEdit(newVal);
            onSave(newVal);
          }}
        />
      ) : config.value_type === "select" &&
        config.config_key === "attendance.absence_basis" ? (
        <div className="flex items-center gap-2">
          <Select
            value={currentValue || "30_days"}
            onChange={(e) => onEdit(e.target.value)}
            onBlur={() => onSave(currentValue)}
            className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
          >
            <option value="30_days">
              {arabicSource("settings.30_days_fixed")}
            </option>
            <option value="calendar_workdays">
              {arabicSource("settings.actual_working_days")}
            </option>
            <option value="fixed_days_per_month">
              {arabicSource("settings.custom_fixed_days")}
            </option>
          </Select>
          {hasChanged && (
            <button
              onClick={() => onSave(currentValue)}
              className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
            >
              {arabicSource("common.save")}
            </button>
          )}
        </div>
      ) : config.value_type === "number" ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentValue || ""}
            onChange={(e) =>
              onEdit(e.target.value ? parseFloat(e.target.value) : 0)
            }
            onBlur={() => onSave(currentValue)}
            className="w-24 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
          />
          {hasChanged && (
            <button
              onClick={() => onSave(currentValue)}
              className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
            >
              {arabicSource("common.save")}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentValue || ""}
            onChange={(e) => onEdit(e.target.value)}
            onBlur={() => onSave(currentValue)}
            className="w-40 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
          />
          {hasChanged && (
            <button
              onClick={() => onSave(currentValue)}
              className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
            >
              {arabicSource("common.save")}
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default ConfigRow;
