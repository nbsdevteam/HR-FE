import { useState } from "react";
import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "../styles";
import SettingsToggle from "./SettingsToggle";

const SecurityCard = () => {
  const [twoFactor, setTwoFactor] = useState(false);

  const handleToggleTwoFactor = (): void => {
    setTwoFactor(!twoFactor);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cardCls}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-foreground">{arabicSource("settings.security")}</h3>
      </div>
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
    </motion.div>
  );
};

export default SecurityCard;
