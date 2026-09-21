import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import NodeAvatar from "@/shared/components/NodeAvatar";
import { fetchEmployeeAvatars, fetchEmployees } from "@/shared/api/core";
import type { EmployeeAvatarProps } from "./contracts";

/**
 * One employee's face, anywhere in the composition.
 *
 * This is the single most duplicated thing the split found: crm-core had 13 imports of an
 * employeeAvatarUrl helper, and the shell's own header had another. Now there is one implementation,
 * owned by the app that owns the photo.
 *
 * Photos are deliberately NOT on /employees/list — a base64 thumbnail per row across a 5,000-row
 * roster is several megabytes — so they come from the dedicated batch endpoint, keyed per id here so
 * TanStack Query dedupes when a list renders fifty of these at once.
 *
 * Satisfies EmployeeAvatarProps in @nbs/contracts.
 */

const SIZES = {
  sm: { sizeClassName: "w-6 h-6", fontSize: 10 },
  md: { sizeClassName: "w-9 h-9", fontSize: 13 },
  lg: { sizeClassName: "w-14 h-14", fontSize: 18 },
} as const;

const initialsOf = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const EmployeeAvatar = ({ employeeId, size = "md", showPresence = false }: EmployeeAvatarProps) => {
  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees", "roster"],
    queryFn: fetchEmployees,
    staleTime: 10 * 60_000,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ["hr", "employees", "avatar", employeeId],
    queryFn: () => fetchEmployeeAvatars([employeeId]),
    staleTime: 10 * 60_000,
  });

  const employee = useMemo(
    () => employees.find((candidate) => candidate.id === employeeId),
    [employees, employeeId]
  );

  const name = employee?.arabic_name || employee?.name || "";
  const photo = avatars[0]?.photo ?? null;
  const { sizeClassName, fontSize } = SIZES[size];

  return (
    <span className="relative inline-flex">
      <NodeAvatar
        photo={photo}
        name={name}
        initials={initialsOf(name)}
        sizeClassName={sizeClassName}
        fontSize={fontSize}
      />
      {/*
        Presence is the CRM's fact, not HR's: it comes from the shared realtime bus that the shell
        owns. Rendering the dot here without that data would be a lie, so the flag reserves the
        space and the indicator lands when presence is wired into @nbs/platform.
      */}
      {showPresence && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-muted border border-background"
        />
      )}
    </span>
  );
};

export default EmployeeAvatar;
