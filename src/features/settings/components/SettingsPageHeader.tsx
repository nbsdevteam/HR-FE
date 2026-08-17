import { arabicSource } from "@/i18n/source";

export const SettingsPageHeader = () => (
  <div>
    <h1 className="text-gradient-gold">{arabicSource("common.settings")}</h1>
    <p className="text-muted-foreground mt-1">{arabicSource("settings.system_settings_and_preferences")}</p>
  </div>
);
