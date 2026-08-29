import type { DbSystemModule } from "@/shared/hooks";
import SettingsToggle from "./SettingsToggle";

type TModuleToggleRowProps = {
  module: DbSystemModule;
  onToggle: () => void;
};

const ModuleToggleRow = ({ module, onToggle }: TModuleToggleRowProps) => (
  <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
    <div className="flex-1">
      <p className="text-foreground text-sm">{module.name_ar}</p>
      {module.description_ar && (
        <p className="text-muted-foreground text-xs mt-1">
          {module.description_ar}
        </p>
      )}
    </div>
    <SettingsToggle on={module.is_enabled} onClick={onToggle} />
  </div>
);

export default ModuleToggleRow;
