import { Briefcase, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components";
import type { SelectedStructureItem } from "../hooks/useStructureView";
import { orgLabel } from "../utils/orgStructure";
import InfoRow from "./InfoRow";

type StructureItemDetailPopoverProps = {
  item: SelectedStructureItem;
  onClose: () => void;
};

/**
 * Read-only detail view for a position or employee card on the level-wise
 * graph. No edit/delete/change-manager here — the org-structure payload
 * carries no manager linkage to support those, so they stay on the Employees
 * page instead of being half-built on top of data that can't back them.
 */
const StructureItemDetailPopover = ({ item, onClose }: StructureItemDetailPopoverProps) => {
  const { t } = useTranslation();
  const departmentLabel = item.department
    ? orgLabel(item.department.department, item.department.department_ar)
    : t("hierarchy.no_department");

  if (item.kind === "employee") {
    return (
      <Modal onClose={onClose} title={item.employee.name} icon={User}>
        <InfoRow label={t("common.job_title")} value={item.employee.job_title || orgLabel(item.position.title, item.position.title_ar)} />
        <InfoRow label={t("common.section")} value={departmentLabel} />
        {item.employee.employee_code && (
          <InfoRow label={t("hierarchy.employee_code")} value={item.employee.employee_code} />
        )}
      </Modal>
    );
  }

  const { position } = item;
  return (
    <Modal onClose={onClose} title={orgLabel(position.title, position.title_ar)} icon={Briefcase}>
      <InfoRow label={t("common.section")} value={departmentLabel} />
      <InfoRow
        label={t("hierarchy.level")}
        value={position.level === null ? t("hierarchy.no_level") : t("hierarchy.level_n", { level: position.level })}
      />
      <InfoRow
        label={t("hierarchy.seats_total")}
        value={
          position.seats > 0
            ? t("hierarchy.filled_of_seats", { filled: position.employee_count, seats: position.seats })
            : t("hierarchy.n_employees", { count: position.employee_count })
        }
      />
      {position.vacancies > 0 && (
        <InfoRow label={t("hierarchy.vacant")} value={t("hierarchy.n_vacant", { count: position.vacancies })} />
      )}
      {position.employees.length > 0 && (
        <div className="space-y-1">
          {position.employees.map((employee) => (
            <p key={employee.employee_id} style={{ fontSize: 13 }}>
              {employee.name}
            </p>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default StructureItemDetailPopover;
