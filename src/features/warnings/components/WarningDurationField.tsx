import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { InputField, Select, type SelectOption } from "@/shared/components";
import {
  WARNING_DURATION_MONTH_OPTIONS,
  WARNING_EXPIRY_CUSTOM,
} from "../constants/warnings";

type TWarningDurationFieldProps = {
  durationMonths: string;
  expiryDate: string;
  storedExpiryDate: string | null;
  onDurationChange: (durationMonths: string) => void;
  onExpiryDateChange: (expiryDate: string) => void;
};

/**
 * Term picker for the warning's expiry. Sends `duration_months` and lets the
 * backend derive the date — the month-end clamping (31 Jan + 1 month → 28 Feb)
 * cannot be previewed client-side without disagreeing with what gets stored,
 * so the currently stored date is shown instead (backend §3).
 */
const WarningDurationField = ({
  durationMonths,
  expiryDate,
  storedExpiryDate,
  onDurationChange,
  onExpiryDateChange,
}: TWarningDurationFieldProps) => {
  const options = useMemo<SelectOption[]>(
    () => [
      ...WARNING_DURATION_MONTH_OPTIONS.map((months) => ({
        value: String(months),
        label: `${months} ${arabicSource("warnings.months")}`,
      })),
      { divider: true },
      { value: WARNING_EXPIRY_CUSTOM, label: arabicSource("warnings.specific_end_date") },
    ],
    [],
  );

  const isCustom = durationMonths === WARNING_EXPIRY_CUSTOM;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
          {arabicSource("warnings.duration_optional")}
        </label>
        <Select
          value={durationMonths}
          onChange={onDurationChange}
          options={options}
          blankLabel={arabicSource("warnings.no_end_date")}
          className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>

      {isCustom && (
        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("warnings.end_date_optional")}
          </label>
          <InputField
            type="date"
            value={expiryDate}
            onChange={onExpiryDateChange}
            className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
          />
        </div>
      )}

      {!isCustom && storedExpiryDate && (
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {arabicSource("warnings.current_end_date")}{" "}
          <span dir="ltr">{storedExpiryDate}</span>
        </p>
      )}
    </div>
  );
};

export default WarningDurationField;
