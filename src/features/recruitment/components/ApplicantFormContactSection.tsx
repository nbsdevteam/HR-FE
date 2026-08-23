import { memo } from "react";
import { Phone } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";

type ApplicantFormContactSectionProps = {
  email: string;
  phone: string;
  onFieldChange: (field: string, value: string) => void;
};

const ApplicantFormContactSection = ({ email, phone, onFieldChange }: ApplicantFormContactSectionProps) => {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("email", e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("phone", e.target.value);
  };

  return (
    <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
      <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
        <Phone className="w-4 h-4" /> {arabicSource("recruitment.contact_information")}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.email")}</label>
          <input type="email" value={email} onChange={handleEmailChange}
            placeholder="email@example.com" className={inputCls} dir="ltr" />
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.phone_number")}</label>
          <input type="tel" value={phone} onChange={handlePhoneChange}
            placeholder="07xxxxxxxxx" className={inputCls} dir="ltr" />
        </div>
      </div>
    </fieldset>
  );
};

export default memo(ApplicantFormContactSection);
