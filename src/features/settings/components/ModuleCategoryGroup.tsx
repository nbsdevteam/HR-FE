import type { DbSystemModule } from "@/shared/hooks";
import CategoryGroupHeader from "./CategoryGroupHeader";
import ModuleToggleRow from "./ModuleToggleRow";

type TModuleCategoryGroupProps = {
  category: string;
  modules: DbSystemModule[];
  onToggleModule: (module: DbSystemModule) => void;
};

const ModuleCategoryGroup = ({
  category,
  modules,
  onToggleModule,
}: TModuleCategoryGroupProps) => (
  <div>
    <CategoryGroupHeader category={category} />
    <div className="space-y-2">
      {modules?.map((module) => (
        <ModuleToggleRow
          key={module.id}
          module={module}
          onToggle={() => onToggleModule(module)}
        />
      ))}
    </div>
  </div>
);

export default ModuleCategoryGroup;
