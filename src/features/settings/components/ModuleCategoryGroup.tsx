import type { DbSystemModule } from "@/shared/hooks";
import { categoryLabels } from "../constants/settings";
import ModuleToggleRow from "./ModuleToggleRow";

type ModuleCategoryGroupProps = {
  category: string;
  modules: DbSystemModule[];
  onToggleModule: (module: DbSystemModule) => void;
};

const ModuleCategoryGroup = ({ category, modules, onToggleModule }: ModuleCategoryGroupProps) => (
  <div>
    <div className="flex items-center gap-3 mb-3 pb-2 border-s-4 border-primary ps-3">
      <h4 className="text-foreground font-medium">{categoryLabels[category] || category}</h4>
    </div>
    <div className="space-y-2">
      {modules.map((module) => (
        <ModuleToggleRow key={module.id} module={module} onToggle={() => onToggleModule(module)} />
      ))}
    </div>
  </div>
);

export default ModuleCategoryGroup;
