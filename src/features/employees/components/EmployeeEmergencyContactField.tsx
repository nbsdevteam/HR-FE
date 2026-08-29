import { Phone } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";

const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

type EmployeeEmergencyContactFieldProps = {
  editData: Employee;
  isEditing: boolean;
  onFieldChange: (field: keyof Employee, value: string | number) => void;
};

const EmployeeEmergencyContactField = ({ editData, isEditing, onFieldChange }: EmployeeEmergencyContactFieldProps) => {
  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("emergencyContact", e.target.value);
  };

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("emergencyPhone", e.target.value);
  };

  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <Phone className="w-5 h-5 text-destructive shrink-0" />
      <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{arabicSource("shared.emergency_contact")}</span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-3">
            <input value={editData.emergencyContact} onChange={handleEmergencyContactChange}
              placeholder={arabicSource("common.name")} className={inputClass} style={{ fontSize: 14 }} />
            <input value={editData.emergencyPhone} onChange={handleEmergencyPhoneChange}
              placeholder={arabicSource("shared.no")} className={`${inputClass} max-w-[160px]`} style={{ fontSize: 14 }} dir="ltr" />
          </div>
        ) : (
          <span className="text-foreground" style={{ fontSize: 14 }}>
            {editData.emergencyContact || "—"} <span className="text-muted-foreground mx-1">—</span> <span dir="ltr">{editData.emergencyPhone || "—"}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default EmployeeEmergencyContactField;
