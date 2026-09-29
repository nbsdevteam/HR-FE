import { Link2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, TypeAhead } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";

type EmployeeDeviceMappingFormProps = {
  candidates: DbEmployee[];
  candidatesLoading: boolean;
  targetId: string;
  targetLabels: Record<string, string>;
  mapping: boolean;
  onTargetChange: (id: string) => void;
  onQueryChange: (query: string) => void;
  onConfirm: () => void;
};

const candidateId = (candidate: DbEmployee): string => candidate.id;

const candidateDescription = (candidate: DbEmployee): string | null =>
  [candidate.position, candidate.department].filter(Boolean).join(" · ") || null;

/** Picks the existing employee a terminal person really is — searched server-side, never matched by name. */
const EmployeeDeviceMappingForm = ({
  candidates,
  candidatesLoading,
  targetId,
  targetLabels,
  mapping,
  onTargetChange,
  onQueryChange,
  onConfirm,
}: EmployeeDeviceMappingFormProps) => {
  const noCandidates = !candidatesLoading && candidates.length === 0 && !targetId;

  return (
    <div className="space-y-2 pt-3 border-t border-border/30">
      <p className="text-foreground text-sm">{arabicSource("employees.device_mapping_title")}</p>
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.device_mapping_hint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <TypeAhead
          items={candidates}
          value={targetId}
          onChange={onTargetChange}
          getId={candidateId}
          getLabel={empDisplayName}
          getDescription={candidateDescription}
          showDescription
          optionsAreData
          remoteFilter
          onQueryChange={onQueryChange}
          fallbackLabels={targetLabels}
          placeholder={arabicSource("employees.device_mapping_search")}
          searchPlaceholder={arabicSource("employees.device_mapping_search")}
          className="flex-1 min-w-[220px]"
        />
        <Button icon={Link2} onClick={onConfirm} loading={mapping} disabled={!targetId} className="h-10 px-3 text-xs">
          {arabicSource("employees.device_mapping_confirm")}
        </Button>
      </div>
      {noCandidates && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.device_mapping_no_candidates")}</p>
      )}
    </div>
  );
};

export default EmployeeDeviceMappingForm;
