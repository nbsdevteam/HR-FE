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
  /** Field-level `designation_not_found` rejection from a save (backend §4). */
  error: string | null;
  onSelectPosition: (positionId: string, positionName: string) => void;
};

const EmployeePositionField = ({
  position,
  positionId,
  allPositions,
  isEditing,
  inputClass,
  error,
  onSelectPosition,
}: EmployeePositionFieldProps) => {
  const positionOptions = useMemo<SelectOption[]>(
    () => allPositions.map((p) => ({ value: p.id, label: p.name })),
    [allPositions],
  );

  // Resolve the name from the exact option clicked, rather than a separate
  // lookup by id elsewhere — avoids dropping the selection if two positions
  // ever share a name or an id fails to resolve in another list copy.
  const handlePositionChange = (value: string): void => {
    const selected = allPositions.find((p) => p.id === value);
    onSelectPosition(value, selected?.name ?? value);
  };

  return (
    <EmployeeFieldRow
      icon={Briefcase} label={arabicSource("shared.job_title")} value={position}
      isEditing={isEditing}
      editElement={
        <>
          <Select
            value={positionId || ""}
            onChange={handlePositionChange}
            options={positionOptions}
            className={inputClass}
            style={{ fontSize: 14 }}
          />
          {error && <p className="text-destructive mt-1" style={{ fontSize: 11 }} role="alert">{error}</p>}
        </>
      }
    />
  );
};

export default EmployeePositionField;
