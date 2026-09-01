import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsToggle from "./SettingsToggle";

const SecurityCard = () => {
  const [twoFactor, setTwoFactor] = useState(false);

  const handleToggleTwoFactor = useCallback((): void => {
    setTwoFactor((prev) => !prev);
  }, []);

  return (
    <SettingsSectionCard
      icon={Shield}
      title={arabicSource("settings.security")}
      delay={0.3}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.change_password")}
          </span>
          <button
            className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            style={{ fontSize: 12 }}
          >
            {arabicSource("common.edit")}
          </button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.two_factor_authentication")}
          </span>
          <SettingsToggle on={twoFactor} onClick={handleToggleTwoFactor} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("settings.log_in")}
          </span>
          <button
            className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            style={{ fontSize: 12 }}
          >
            {arabicSource("common.width")}
          </button>
        </div>
      </div>
    </SettingsSectionCard>
  );
};

export default SecurityCard;
