import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbContractType } from "@/shared/hooks";
import SettingsToggle from "./SettingsToggle";

interface IContractTypeListItemProps {
  contractType: DbContractType;
  onToggleActive: (contractType: DbContractType) => void;
  onDelete: (contractTypeId: string) => void;
}

const ContractTypeListItem = ({
  contractType,
  onToggleActive,
  onDelete,
}: IContractTypeListItemProps) => {
  const { primary } = useLocalizedName(contractType.name_ar, contractType.name_en);

  const handleToggleActive = useCallback((): void => {
    onToggleActive(contractType);
  }, [onToggleActive, contractType]);

  const handleDelete = useCallback((): void => {
    onDelete(contractType.id);
  }, [onDelete, contractType.id]);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
          {contractType.code}
        </span>
        <div>
          <p className="text-sm text-foreground" data-i18n-ignore>{primary}</p>
          <p className="text-xs text-muted-foreground">
            {contractType.default_duration_months
              ? `${contractType.default_duration_months} ${arabicSource("settings.month")}`
              : arabicSource("common.not_specified")}{" "}
            {arabicSource("settings.experiment")} {contractType.probation_days}{" "}
            {arabicSource("settings.day_notice")}{" "}
            {contractType.notice_period_days} {arabicSource("common.days_2")}
            {contractType.is_renewable &&
              " " + arabicSource("settings.renewable")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SettingsToggle on={contractType.is_active} onClick={handleToggleActive} />
        <button
          onClick={handleDelete}
          className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default memo(ContractTypeListItem);
