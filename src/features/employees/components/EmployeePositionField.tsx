import { useMemo } from "react";
import { Briefcase } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { PositionOption } from "../types";
import EmployeeFieldRow from "./EmployeeFieldRow";

type EmployeePositionFieldProps = {
  position: string;
  positionId: string | null;
  allPositions: PositionOption[];
  isEditing: boolean;
  inputClass: string;
  onSelectPosition: (positionId: string) => void;
};

const EmployeePositionField = ({
  position,
  positionId,
  allPositions,
  isEditing,
  inputClass,
  onSelectPosition,
}: EmployeePositionFieldProps) => {
  const positionOptions = useMemo<SelectOption[]>(
    () => allPositions.map((p) => ({ value: p.id, label: p.name })),
    [allPositions],
  );

  return (
    <EmployeeFieldRow
      icon={Briefcase} label={arabicSource("shared.job_title")} value={position}
      isEditing={isEditing}
      editElement={
        <Select
          value={positionId || ""}
          onChange={onSelectPosition}
          options={positionOptions}
          className={inputClass}
          style={{ fontSize: 14 }}
        />
      }
    />
  );
};

export default EmployeePositionField;
