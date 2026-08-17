import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";

const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.leave")]: "bg-primary/15 border-primary/30 text-primary",
  [arabicSource("common.finished")]: "bg-destructive/15 border-destructive/30 text-destructive",
};

type EmployeeIdentityCardProps = {
  editData: Employee;
};

const EmployeeIdentityCard = ({ editData }: EmployeeIdentityCardProps) => (
  <div className="flex items-center gap-4 bg-muted/10 rounded-xl p-4 border border-border/30">
    <div className="relative shrink-0">
      {editData.photo ? (
        <img
          src={editData.photo}
          alt={editData.name}
          className="w-20 h-20 rounded-full object-cover shadow-lg"
          style={{ border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" }}
        />
      ) : (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20 shadow-lg"
          style={{ border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" }}
        >
          <span className="text-primary" style={{ fontSize: 28 }}>{editData.name.charAt(0)}</span>
        </div>
      )}
      <div className={`absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full border-[2.5px] border-card ${
        editData.status === arabicSource("common.is_active") ? "bg-emerald-500" : editData.status === arabicSource("common.leave") ? "bg-primary" : editData.status === arabicSource("common.pending") ? "bg-amber-500" : "bg-destructive"
      }`} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-foreground truncate" style={{ fontSize: 18 }}>{editData.name}</h3>
      <p className="text-muted-foreground mt-0.5" style={{ fontSize: 14 }}>{editData.position}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`px-2.5 py-0.5 rounded-md border ${statusColors[editData.status]}`} style={{ fontSize: 11 }}>
          {editData.status}
        </span>
        <span className="text-muted-foreground px-2 py-0.5 rounded-md bg-muted/20" style={{ fontSize: 11 }} dir="ltr">
          {editData.employeeNumber}
        </span>
      </div>
    </div>
  </div>
);

export default EmployeeIdentityCard;
