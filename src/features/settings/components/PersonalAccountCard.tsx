import { motion } from "motion/react";
import { User } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "../styles";
import { PERSONAL_ACCOUNT_ITEMS } from "../constants/settings";
import AccountInfoRow from "./AccountInfoRow";

const PersonalAccountCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className={cardCls}
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
        <User className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-foreground">{arabicSource("settings.personal_account")}</h3>
    </div>
    <div className="space-y-4">
      {PERSONAL_ACCOUNT_ITEMS.map((item) => (
        <AccountInfoRow key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  </motion.div>
);

export default PersonalAccountCard;
