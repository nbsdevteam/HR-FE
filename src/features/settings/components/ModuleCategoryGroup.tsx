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
}: TModuleCategoryGroupProps) => {
  const handleToggleModule = (module: DbSystemModule) => (): void => {
    onToggleModule(module);
  };

  return (
    <div>
      <CategoryGroupHeader category={category} />
      <div className="space-y-2">
        {modules?.map((module) => (
          <ModuleToggleRow
            key={module.id}
            module={module}
            onToggle={handleToggleModule(module)}
          />
        ))}
      </div>
    </div>
  );
};

export default ModuleCategoryGroup;
