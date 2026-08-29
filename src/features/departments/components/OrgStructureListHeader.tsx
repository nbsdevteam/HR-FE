import { useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type OrgStructureListHeaderProps = {
  count: number;
  countSuffix: string;
  includeArchived: boolean;
  onIncludeArchivedChange: (includeArchived: boolean) => void;
  canCreate: boolean;
  onAdd: () => void;
  addLabel: string;
};

const OrgStructureListHeader = ({
  count,
  countSuffix,
  includeArchived,
  onIncludeArchivedChange,
  canCreate,
  onAdd,
  addLabel,
}: OrgStructureListHeaderProps) => {
  const handleIncludeArchivedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onIncludeArchivedChange(e.target.checked);
  }, [onIncludeArchivedChange]);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-muted-foreground text-sm">{count} {countSuffix}</p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-muted-foreground text-sm cursor-pointer">
          <input type="checkbox" checked={includeArchived} onChange={handleIncludeArchivedChange} />
          {arabicSource("org_structure.include_archived_label")}
        </label>
        {canCreate && (
          <Button variant="primary" size="sm" icon={Plus} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrgStructureListHeader;
