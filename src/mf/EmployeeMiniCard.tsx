import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "@/shared/api/core";
import EmployeeAvatar from "./EmployeeAvatar";

/**
 * Who this person is, in one line — for a CRM screen that mentions an employee and should not have
 * to know anything about HR's data model.
 *
 * This replaces the FULL detail sheet that CRM's registry originally asked HR to expose. HR's
 * EmployeeDetailPanel is driven by a container hook (useEmployeeDetailPanel) and takes a prop bag of
 * some forty fields — editing state, department options, custody lists, termination dialogs. Wrapping
 * that behind an {employeeId} facade would mean reconstructing all of it inside this file, which is
 * how a wrapper turns into a fork. The honest move is to expose the summary now and refactor the
 * panel to be prop-addressable on the HR side before exposing it.
 */

type EmployeeMiniCardProps = {
  employeeId: string;
  /** Render without the department line, for tight rows. */
  dense?: boolean;
};

const EmployeeMiniCard = ({ employeeId, dense = false }: EmployeeMiniCardProps) => {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["hr", "employees", "roster"],
    queryFn: fetchEmployees,
    staleTime: 10 * 60_000,
  });

  const employee = useMemo(
    () => employees.find((candidate) => candidate.id === employeeId),
    [employees, employeeId]
  );

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading…</span>;
  }

  if (!employee) {
    // An id the viewer cannot see is indistinguishable from one that does not exist: HR's record
    // rules filter the roster server-side. Either way, saying so beats an empty box.
    return <span className="text-xs text-muted-foreground">Employee not available</span>;
  }

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <EmployeeAvatar employeeId={employeeId} size={dense ? "sm" : "md"} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium" data-i18n-ignore>
          {employee.arabic_name || employee.name}
        </span>
        {!dense && employee.department && (
          <span className="text-xs text-muted-foreground" data-i18n-ignore>
            {employee.department}
          </span>
        )}
      </span>
    </span>
  );
};

export default EmployeeMiniCard;
