import { useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Trash2, Edit2, X } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { defaultDeptColorMap } from "../styles";
import { countDescendants, findParentOf } from "../utils/hierarchyTree";
import DirectReportRow from "./DirectReportRow";
import InfoRow from "./InfoRow";

const DetailPanel = ({ node, orgTree, onClose, onDelete, onEdit }: {
  node: OrgNode; orgTree: OrgNode; onClose: () => void;
  onDelete: (node: OrgNode) => void;
  onEdit: (node: OrgNode) => void;
}) => {
  const parentNode = useMemo(
    () => findParentOf(orgTree, node.id),
    [orgTree, node.id],
  );
  const teamSize = useMemo(() => countDescendants(node), [node]);

  const topColor = defaultDeptColorMap[node.department] || node.color;
  const isRoot = node.id === orgTree.id;
  const isVirtualRoot = node.dbId === "__root__";

  const handleEditClick = useCallback((): void => {
    onEdit(node);
  }, [node, onEdit]);

  const handleDeleteClick = useCallback((): void => {
    onDelete(node);
  }, [node, onDelete]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden" style={{ minWidth: 300, maxWidth: 340 }}>
      <div className="h-1.5" style={{ background: topColor }} />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {!isRoot && !isVirtualRoot && (
              <button onClick={handleEditClick} className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title={arabicSource("hierarchy.modify_data")}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isRoot && !isVirtualRoot && (
              <button onClick={handleDeleteClick} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title={arabicSource("common.separation_from_the_structure")}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <NodeAvatar
            photo={node.photo}
            name={node.name}
            color={node.color}
            initials={node.initials}
            sizeClassName="w-16 h-16"
            extraClassName="shadow-lg mb-3"
            fontSize={24}
            imgStyle={{ border: `3px solid ${topColor}` }}
          />
          <h3 className="text-foreground" data-i18n-ignore>{node.name}</h3>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }} data-i18n-ignore>{node.position}</p>
          <span className="mt-2 px-3 py-1 rounded-full text-white" style={{ fontSize: 11, background: topColor }} data-i18n-ignore>{node.department}</span>
        </div>

        {!isVirtualRoot && (
          <div className="mt-5 space-y-3">
            <InfoRow label={arabicSource("common.employee_number")} value={`EMP-${String(node.id).padStart(4, "0")}`} />
            {parentNode && parentNode.dbId !== "__root__" && (
              <InfoRow
                label={arabicSource("common.direct_manager")}
                value={
                  <div className="flex items-center gap-1.5">
                    <NodeAvatar photo={parentNode.photo} name={parentNode.name} color={parentNode.color} initials={parentNode.initials} sizeClassName="w-5 h-5" fontSize={8} />
                    <span className="text-foreground" style={{ fontSize: 12 }} data-i18n-ignore>{parentNode.name}</span>
                  </div>
                }
              />
            )}
            {!parentNode && (
              <InfoRow
                label={arabicSource("common.direct_manager")}
                value={arabicSource("common.without_a_manager_top_of_the_pyramid")}
                valueClassName="text-primary"
              />
            )}
            <InfoRow label={arabicSource("common.direct_reports")} value={node.children.length} />
            <InfoRow label={arabicSource("hierarchy.total_team")} value={teamSize} />
            {node.email && (
              <InfoRow label={arabicSource("common.post")} value={node.email} dir="ltr" />
            )}
          </div>
        )}

        {node.children.length > 0 && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("common.direct_reports")}</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {node.children.map(child => (
                <DirectReportRow key={child.dbId} node={child} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

};

export default DetailPanel;
