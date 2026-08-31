import { Calendar, Settings as SettingsIcon } from "lucide-react";
import { useAppSettings, type MonthFormat } from "@/app/providers";
import { arabicSource } from "@/i18n/source";
import { MONTH_FORMATS } from "../constants/settings";
import MonthFormatOption from "./MonthFormatOption";
import SettingsSectionCard from "./SettingsSectionCard";

const SystemDisplayCard = () => {
  const { settings, updateSettings } = useAppSettings();

  const handleMonthFormatSelect = (value: MonthFormat) => (): void => {
    updateSettings({ monthFormat: value });
  };

  return (
    <SettingsSectionCard
      icon={SettingsIcon}
      title={arabicSource("common.system")}
      delay={0.4}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.language")}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.arabic")}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.time_zone")}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.baghdad_gmt_3")}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-foreground flex items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Calendar className="w-4 h-4 text-primary" />
              {arabicSource("settings.month_display_format")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MONTH_FORMATS.map((fmt) => (
              <MonthFormatOption
                key={fmt.value}
                value={fmt.value}
                label={fmt.label}
                example={fmt.example}
                isActive={settings.monthFormat === fmt.value}
                onSelect={handleMonthFormatSelect(fmt.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </SettingsSectionCard>
  );
};

export default SystemDisplayCard;
