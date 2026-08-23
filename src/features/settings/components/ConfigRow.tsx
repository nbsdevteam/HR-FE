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
}: IConfigRowProps) => {
  const handleToggleClick = (): void => {
    const newVal = !(currentValue === true || currentValue === "true");
    onEdit(newVal);
    onSave(newVal);
  };

  const handleSelectChange = (value: string): void => {
    onEdit(value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onEdit(e.target.value ? parseFloat(e.target.value) : 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onEdit(e.target.value);
  };

  const handleSaveCurrentValue = (): void => {
    onSave(currentValue);
  };

  return (
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
            onClick={handleToggleClick}
          />
        ) : config.value_type === "select" &&
          config.config_key === "attendance.absence_basis" ? (
          <div className="flex items-center gap-2">
            <Select
              value={currentValue || "30_days"}
              onChange={handleSelectChange}
              onBlur={handleSaveCurrentValue}
              options={[
                { value: "30_days", label: arabicSource("settings.30_days_fixed") },
                { value: "calendar_workdays", label: arabicSource("settings.actual_working_days") },
                { value: "fixed_days_per_month", label: arabicSource("settings.custom_fixed_days") },
              ]}
              className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
            />
            {hasChanged && (
              <button
                onClick={handleSaveCurrentValue}
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
              onChange={handleNumberChange}
              onBlur={handleSaveCurrentValue}
              className="w-24 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
            />
            {hasChanged && (
              <button
                onClick={handleSaveCurrentValue}
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
              onChange={handleTextChange}
              onBlur={handleSaveCurrentValue}
              className="w-40 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
            />
            {hasChanged && (
              <button
                onClick={handleSaveCurrentValue}
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
};

export default ConfigRow;
