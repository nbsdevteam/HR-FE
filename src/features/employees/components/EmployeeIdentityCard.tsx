import { Camera, X } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { statusColors } from "../styles";
import type { Employee } from "../types";

const avatarStyle = { border: "3px solid var(--primary)", boxShadow: "0 4px 20px rgba(var(--primary-rgb, 212,175,55), 0.25)" };

type EmployeeIdentityCardProps = {
  editData: Employee;
  isEditing?: boolean;
  photoError?: string | null;
  onPhotoChange?: (photo: string) => void;
};

const EmployeeIdentityCard = ({ editData, isEditing = false, photoError = null, onPhotoChange }: EmployeeIdentityCardProps) => {
  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onPhotoChange) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (): void => {
    onPhotoChange?.("");
  };

  return (
  <div className="flex items-start gap-4 bg-muted/10 rounded-xl p-4 border border-border/30">
    <div className="flex flex-col items-center gap-1.5">
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
        {isEditing && (
          <label
            className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow"
            title={arabicSource(editData.photo ? "employees.change_photo" : "employees.upload_an_image")}
          >
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/bmp,image/svg+xml" className="hidden" onChange={handlePhotoInputChange} />
          </label>
        )}
      </div>
      {isEditing && editData.photo && (
        <button
          type="button"
          onClick={handleRemovePhoto}
          className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
          style={{ fontSize: 11 }}
        >
          <X className="w-3 h-3" />
          {arabicSource("employees.remove_photo")}
        </button>
      )}
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
      {isEditing && photoError && (
        <p className="text-destructive mt-2" style={{ fontSize: 12 }}>{photoError}</p>
      )}
    </div>
  </div>
  );
};

export default EmployeeIdentityCard;
