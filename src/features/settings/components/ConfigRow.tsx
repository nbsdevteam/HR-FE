import { memo, useCallback } from "react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbConfiguration } from "@/shared/hooks";
import type { ConfigValue } from "../types";
import ConfigSaveButton from "./ConfigSaveButton";
import SettingsToggle from "./SettingsToggle";

interface IConfigRowProps {
  config: DbConfiguration;
  currentValue: ConfigValue;
  hasChanged: boolean;
  onEdit: (configId: string, value: ConfigValue) => void;
  onSave: (configId: string, value: ConfigValue, configKey?: string) => void;
}

const ABSENCE_BASIS_OPTIONS = [
  { value: "30_days", label: arabicSource("settings.30_days_fixed") },
  { value: "calendar_workdays", label: arabicSource("settings.actual_working_days") },
  { value: "fixed_days_per_month", label: arabicSource("settings.custom_fixed_days") },
];

const FIELD_CLASS =
  "bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary";

/** Preserve the previous `currentValue || ""` rendering while staying typed. */
const toInputValue = (value: ConfigValue): string | number =>
  typeof value === "boolean" ? "" : value || "";

/**
 * Takes `configId`-carrying callbacks rather than pre-bound ones so the parent
 * does not mint a fresh closure per row on every render — that is what lets this
 * row be `memo`ized, so editing one setting no longer re-renders the whole
 * category.
 */
const ConfigRow = ({
  config,
  currentValue,
  hasChanged,
  onEdit,
  onSave,
}: IConfigRowProps) => {
  const handleToggleClick = useCallback((): void => {
    const newVal = !(currentValue === true || currentValue === "true");
    onEdit(config.id, newVal);
    onSave(config.id, newVal, config.config_key);
  }, [config.config_key, config.id, currentValue, onEdit, onSave]);

  const handleSelectChange = useCallback((value: string): void => {
    onEdit(config.id, value);
  }, [config.id, onEdit]);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onEdit(config.id, e.target.value ? parseFloat(e.target.value) : 0);
  }, [config.id, onEdit]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onEdit(config.id, e.target.value);
  }, [config.id, onEdit]);

  const handleSaveCurrentValue = useCallback((): void => {
    onSave(config.id, currentValue, config.config_key);
  }, [config.config_key, config.id, currentValue, onSave]);

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
              value={String(toInputValue(currentValue) || "30_days")}
              onChange={handleSelectChange}
              onBlur={handleSaveCurrentValue}
              options={ABSENCE_BASIS_OPTIONS}
              className={FIELD_CLASS}
            />
            {hasChanged && <ConfigSaveButton onSave={handleSaveCurrentValue} />}
          </div>
        ) : config.value_type === "number" ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={toInputValue(currentValue)}
              onChange={handleNumberChange}
              onBlur={handleSaveCurrentValue}
              className={`w-24 ${FIELD_CLASS}`}
            />
            {hasChanged && <ConfigSaveButton onSave={handleSaveCurrentValue} />}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={toInputValue(currentValue)}
              onChange={handleTextChange}
              onBlur={handleSaveCurrentValue}
              className={`w-40 ${FIELD_CLASS}`}
            />
            {hasChanged && <ConfigSaveButton onSave={handleSaveCurrentValue} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConfigRow);
