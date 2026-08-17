import { motion } from "motion/react";
import { Calendar, Settings as SettingsIcon } from "lucide-react";
import { useAppSettings } from "@/app/providers";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "../styles";
import { MONTH_FORMATS } from "../constants/settings";
import MonthFormatOption from "./MonthFormatOption";

const SystemDisplayCard = () => {
  const { settings, updateSettings } = useAppSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cardCls}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-foreground">{arabicSource("common.system")}</h3>
      </div>
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
            <span className="text-foreground flex items-center gap-2" style={{ fontSize: 13 }}>
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
                onSelect={() => updateSettings({ monthFormat: fmt.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemDisplayCard;
