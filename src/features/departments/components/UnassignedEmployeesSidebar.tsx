import { Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import DraggableEmployeeCard from "./DraggableEmployeeCard";

type UnassignedEmployeesSidebarProps = {
  totalCount: number;
  empSearch: string;
  onSearchChange: (value: string) => void;
  filteredUnassigned: DbEmployee[];
  deptColors: Record<string, string>;
};

const UnassignedEmployeesSidebar = ({ totalCount, empSearch, onSearchChange, filteredUnassigned, deptColors }: UnassignedEmployeesSidebarProps) => (
  <div className="w-72 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col">
    <div className="p-3 border-b border-border/30">
      <h3 className="text-foreground mb-2" style={{ fontSize: 14 }}>{arabicSource("hierarchy.employees_without_position")}{totalCount})</h3>
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" value={empSearch} onChange={e => onSearchChange(e.target.value)}
          placeholder={arabicSource("common.search")}
          className="w-full bg-background border border-border/40 rounded-lg ps-8 pe-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          style={{ fontSize: 12 }} />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
      {filteredUnassigned.length > 0 ? filteredUnassigned.map(emp => (
        <DraggableEmployeeCard key={emp.id} emp={emp} deptColors={deptColors} />
      )) : (
        <p className="text-center text-muted-foreground py-6" style={{ fontSize: 12 }}>
          {empSearch ? arabicSource("common.no_results_found") : arabicSource("hierarchy.all_employees_are_appointed_to_positions")}
        </p>
      )}
    </div>
  </div>
);

export default UnassignedEmployeesSidebar;
