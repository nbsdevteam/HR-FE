import { User } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { PERSONAL_ACCOUNT_ITEMS } from "../constants/settings";
import AccountInfoRow from "./AccountInfoRow";
import SettingsSectionCard from "./SettingsSectionCard";

const PersonalAccountCard = () => (
  <SettingsSectionCard
    icon={User}
    title={arabicSource("settings.personal_account")}
    delay={0.1}
  >
    <div className="space-y-4">
      {PERSONAL_ACCOUNT_ITEMS.map((item) => (
        <AccountInfoRow key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  </SettingsSectionCard>
);

export default PersonalAccountCard;
