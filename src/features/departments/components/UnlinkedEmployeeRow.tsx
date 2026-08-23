import { memo, useMemo, useCallback } from "react";
import { Link2 } from "lucide-react";
import { Button, TypeAhead } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";

const getManagerId = (n: OrgNode): string => n.dbId;
const getManagerLabel = (n: OrgNode): string => `${n.name} — ${n.position}`;

type UnlinkedEmployeeRowProps = {
  employee: DbEmployee;
  /** Every node that may act as a manager (virtual root already removed). */
  linkableNodes: OrgNode[];
  selectedManagerDbId: string;
  onSelectManager: (employeeId: string, managerDbId: string) => void;
  onLink: (employeeId: string) => void;
};

const UnlinkedEmployeeRow = ({
  employee,
  linkableNodes,
  selectedManagerDbId,
  onSelectManager,
  onLink,
}: UnlinkedEmployeeRowProps) => {
  const name = empDisplayName(employee);

  const managerOptions = useMemo(
    () => linkableNodes.filter((node) => node.dbId !== employee.id),
    [linkableNodes, employee.id],
  );

  const handleManagerChange = useCallback(
    (value: string): void => {
      onSelectManager(employee.id, value);
    },
    [employee.id, onSelectManager],
  );

  const handleLinkClick = useCallback((): void => {
    onLink(employee.id);
  }, [employee.id, onLink]);

  return (
    <div className="p-3 rounded-xl border border-border/40 bg-muted/5 space-y-2">
      <div className="flex items-center gap-2.5">
        {employee.profile_picture ? (
          <img
            src={employee.profile_picture}
            alt={name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-500" style={{ fontSize: 13 }}>
              {name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>
            {name}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {employee.position || employee.department || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TypeAhead
          items={managerOptions}
          getId={getManagerId}
          getLabel={getManagerLabel}
          value={selectedManagerDbId}
          onChange={handleManagerChange}
          placeholder={arabicSource("hierarchy.choose_the_direct_manager")}
          className="flex-1"
        />
        <Button
          size="sm"
          icon={Link2}
          onClick={handleLinkClick}
          disabled={!selectedManagerDbId}
          style={{ fontSize: 12 }}
        >
          {arabicSource("hierarchy.connect")}
        </Button>
      </div>
    </div>
  );
};

export default memo(UnlinkedEmployeeRow);
