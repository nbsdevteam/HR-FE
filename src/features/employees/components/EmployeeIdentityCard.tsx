import { NodeAvatar } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { statusColors } from "../styles";
import type { Employee } from "../types";

const avatarStyle = { border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" };

type EmployeeIdentityCardProps = {
  editData: Employee;
};

const EmployeeIdentityCard = ({ editData }: EmployeeIdentityCardProps) => (
  <div className="flex items-center gap-4 bg-muted/10 rounded-xl p-4 border border-border/30">
    <div className="relative shrink-0">
      <NodeAvatar
        photo={editData.photo}
        name={editData.name}
        initials={editData.name.charAt(0)}
        sizeClassName="w-20 h-20"
        extraClassName="shadow-lg"
        imgStyle={avatarStyle}
        fallbackClassName="bg-primary/20"
        fallbackStyle={avatarStyle}
        textClassName="text-primary"
        fontSize={28}
      />
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
