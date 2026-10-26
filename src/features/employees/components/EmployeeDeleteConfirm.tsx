import { AnimatePresence } from "motion/react";
import { ConfirmDeleteModal } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget, EmployeeInUseGuard } from "../types";

type EmployeeDeleteConfirmProps = {
  target: DeleteEmployeeTarget | null;
  guard: EmployeeInUseGuard | null;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** The archive confirmation, re-armed with the `employee_in_use` counts for a `force: true` retry. */
const EmployeeDeleteConfirm = ({ target, guard, deleting, onConfirm, onClose }: EmployeeDeleteConfirmProps) => (
  <AnimatePresence>
    {target && (
      <ConfirmDeleteModal
        title={arabicSource("employees.confirm_deletion")}
        message={
          guard ? (
            <>
              {arabicSource("employees.in_use_message_prefix")}{" "}
              <span className="text-foreground font-medium">{target.name}</span>{" "}
              {arabicSource("employees.in_use_message_middle")} {guard.reportCount} {arabicSource("employees.reports_suffix")}, {guard.departmentCount} {arabicSource("employees.departments_suffix")}
            </>
          ) : (
            <>
              {arabicSource("employees.are_you_sure_you_want_to_delete_the_employee")}{" "}
              <span className="text-foreground font-medium">{target.name}</span>
              {arabicSource("employees.all_his_data_will_be_deleted_from_the_system_and_he_will_be_remo")}
            </>
          )
        }
        confirmLabel={guard ? arabicSource("employees.force_delete_action") : arabicSource("employees.delete_employee")}
        loadingLabel={arabicSource("employees.deleting")}
        loading={deleting}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    )}
  </AnimatePresence>
);

export default EmployeeDeleteConfirm;
