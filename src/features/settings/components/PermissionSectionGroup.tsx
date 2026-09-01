import type { HrPermissionActionMap } from "../api/permissionsAdmin";
import { permissionSectionLabel } from "../utils/permissionLabels";
import PermissionActionToggle from "./PermissionActionToggle";

type TPermissionSectionGroupProps = {
  section: string;
  actions: HrPermissionActionMap;
  disabled: boolean;
  onToggle: (section: string, action: string) => void;
};

const PermissionSectionGroup = ({
  section,
  actions,
  disabled,
  onToggle,
}: TPermissionSectionGroupProps) => (
  <div className="border border-border/30 rounded-xl p-3 bg-card/20">
    <h4 className="text-foreground mb-2" style={{ fontSize: 13, fontWeight: "var(--font-weight-medium)" }}>
      {permissionSectionLabel(section)}
    </h4>
    <div className="flex flex-wrap gap-2">
      {Object.keys(actions).map((action) => (
        <PermissionActionToggle
          key={action}
          section={section}
          action={action}
          granted={actions[action] === true}
          disabled={disabled}
          onToggle={onToggle}
        />
      ))}
    </div>
  </div>
);

export default PermissionSectionGroup;
