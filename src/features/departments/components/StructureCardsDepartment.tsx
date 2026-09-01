import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment } from "@/shared/hooks";
import {
  departmentSeats,
  departmentStaffOnPositions,
  departmentStaffWithoutPosition,
  groupPositionsByLevel,
  orgLabel,
} from "../utils/orgStructure";
import StructureCardsLevelGroup from "./StructureCardsLevelGroup";

type StructureCardsDepartmentProps = {
  department: OrgStructureDepartment;
};

/**
 * The root card of the structure: one department, its positions grouped into
 * seniority bands, and the real people in each.
 *
 * A department with no positions still renders — its emptiness is part of the
 * structure, not a reason to hide it.
 */
const StructureCardsDepartment = ({ department }: StructureCardsDepartmentProps) => {
  const { t } = useTranslation();

  const groups = useMemo(
    () => groupPositionsByLevel(department.positions),
    [department.positions],
  );
  const onPositions = departmentStaffOnPositions(department);
  const seats = departmentSeats(department);
  const withoutPosition = departmentStaffWithoutPosition(department);

  return (
    <section className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-border/40 bg-muted/10 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold" style={{ fontSize: 14.5 }}>
              {orgLabel(department.department, department.department_ar)}
            </h3>
            {department.parent_department && (
              <p className="text-muted-foreground truncate" style={{ fontSize: 11.5 }}>
                {department.parent_department}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-end text-muted-foreground" style={{ fontSize: 11.5 }}>
          <p className="tabular-nums">
            {t("hierarchy.n_positions", { count: department.position_count })}
          </p>
          {seats > 0 && (
            <p className="tabular-nums">
              {t("hierarchy.filled_of_seats", { filled: onPositions, seats })}
            </p>
          )}
        </div>
      </header>

      <div className="px-4 py-3 space-y-3">
        {groups.length === 0 ? (
          <p className="text-muted-foreground" style={{ fontSize: 12.5 }}>
            {t("hierarchy.no_positions_defined")}
          </p>
        ) : (
          groups.map((group) => (
            <StructureCardsLevelGroup key={group.level ?? "none"} group={group} />
          ))
        )}

        {/*
          department.employee_count includes people holding no position, so it
          is not the sum of the rows above. Surface the remainder separately
          instead of letting the two numbers silently disagree.
        */}
        {withoutPosition > 0 && (
          <p
            className="border-t border-border/30 pt-2 text-muted-foreground"
            style={{ fontSize: 11.5 }}
          >
            {t("hierarchy.n_without_position", { count: withoutPosition })}
          </p>
        )}
      </div>
    </section>
  );
};

export default StructureCardsDepartment;
