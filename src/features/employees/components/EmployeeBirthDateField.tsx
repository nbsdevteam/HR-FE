import { Cake } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { todayInBaghdad } from "@/shared/utils/timezone";
import type { Employee } from "../types";

const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

type EmployeeBirthDateFieldProps = {
  birthDate: string;
  isEditing: boolean;
  /** Field-level rejection from `invalid_birth_date` / `birth_date_in_future`. */
  error: string | null;
  onFieldChange: (field: keyof Employee, value: string | number) => void;
};

const EmployeeBirthDateField = ({ birthDate, isEditing, error, onFieldChange }: EmployeeBirthDateFieldProps) => {
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("birthDate", e.target.value);
  };

  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)", borderBottomStyle: "solid", opacity: 0.9 }}>
      <Cake className="w-5 h-5 text-primary shrink-0" />
      <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{arabicSource("common.birth_date")}:</span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <>
            <input
              type="date"
              value={birthDate}
              onChange={handleBirthDateChange}
              max={todayInBaghdad()}
              className={`${inputClass} ${error ? "border-destructive" : ""}`}
              style={{ fontSize: 14 }}
              aria-invalid={error ? true : undefined}
              dir="ltr"
            />
            {error && <p className="text-destructive mt-1" style={{ fontSize: 11 }}>{error}</p>}
          </>
        ) : (
          <span className="text-foreground" style={{ fontSize: 14 }} dir="ltr">{birthDate || "—"}</span>
        )}
      </div>
    </div>
  );
};

export default EmployeeBirthDateField;
