import { useState } from "react";
import { AlertTriangle, Link2, X } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";

const UnlinkedPanel = ({ employees, allNodes, onLink, onClose }: {
  employees: DbEmployee[];
  allNodes: OrgNode[];
  onLink: (empDbId: string, managerDbId: string) => void;
  onClose: () => void;
}) => {
  const [selectedManager, setSelectedManager] = useState<Record<string, string>>({});

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
      }}
    >
        <div className="bg-amber-500/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.employees_without_attachment")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.these_employees_do_not_have_a_specific_manager_identify_their_di")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {employees.map(emp => {
            const name = empDisplayName(emp);
            return (
              <div key={emp.id} className="p-3 rounded-xl border border-border/40 bg-muted/5 space-y-2">
                <div className="flex items-center gap-2.5">
                  {emp.profile_picture ? (
                    <img src={emp.profile_picture} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-500" style={{ fontSize: 13 }}>{name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-foreground" style={{ fontSize: 13 }}>{name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{emp.position || emp.department || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedManager[emp.id] || ""}
                    onChange={e => setSelectedManager(p => ({ ...p, [emp.id]: e.target.value }))}
                    className="flex-1 bg-background border border-border/60 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 12 }}
                  >
                    <option value="">{arabicSource("hierarchy.choose_the_direct_manager")}</option>
                    {allNodes.filter(n => n.dbId !== "__root__" && n.dbId !== emp.id).map(n => (
                      <option key={n.dbId} value={n.dbId}>{n.name} — {n.position}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedManager[emp.id]) onLink(emp.id, selectedManager[emp.id]);
                    }}
                    disabled={!selectedManager[emp.id]}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1"
                    style={{ fontSize: 12 }}
                  >
                    <Link2 className="w-3.5 h-3.5" /> {arabicSource("hierarchy.connect")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
    </ModalOverlay>
  );

};

export default UnlinkedPanel;
