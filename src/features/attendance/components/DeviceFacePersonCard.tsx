import { Eye, Loader2, ScanFace, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DevicePerson } from "../types";
import DeviceCredentialIcons from "./DeviceCredentialIcons";

type DeviceFacePersonCardProps = {
  person: DevicePerson;
  uploading: boolean;
  onViewFace: (employeeNumber: string) => void;
  onUploadFace: (employeeNumber: string, file: File) => void;
};

const DeviceFacePersonCard = ({
  person,
  uploading,
  onViewFace,
  onUploadFace,
}: DeviceFacePersonCardProps) => {
  const handleViewFaceClick = (_event: React.MouseEvent<HTMLButtonElement>): void => {
    onViewFace(person.employeeNo);
  };

  const handleFaceFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) onUploadFace(person.employeeNo, file);
    event.target.value = "";
  };

  return (
  <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-4 text-center space-y-2 hover:border-primary/30 transition-colors">
    <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center overflow-hidden">
      {person.numOfFace > 0 ? (
        <button onClick={handleViewFaceClick} className="w-full h-full flex items-center justify-center hover:bg-muted/50 transition-colors">
          <ScanFace className="w-8 h-8 text-emerald-400" />
        </button>
      ) : (
        <ScanFace className="w-8 h-8 text-muted-foreground/30" />
      )}
    </div>
    <div>
      <p className="text-sm text-foreground truncate">{person.name}</p>
      <p className="text-xs text-muted-foreground font-mono" dir="ltr">#{person.employeeNo}</p>
    </div>
    <div className="flex items-center justify-center gap-1">
      <DeviceCredentialIcons fp={person.numOfFP} face={person.numOfFace} card={person.numOfCard} />
    </div>
    <div className="flex gap-1 justify-center">
      {person.numOfFace > 0 ? (
        <button
          onClick={handleViewFaceClick}
          className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <Eye className="w-3 h-3 inline me-1" />
          {arabicSource("common.width")}
        </button>
      ) : null}
      <label className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer">
        {uploading ? (
          <Loader2 className="w-3 h-3 inline animate-spin" />
        ) : (
          <>
            <Upload className="w-3 h-3 inline me-1" />
            {arabicSource("devicemanagement.lift")}
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFaceFileChange}
        />
      </label>
    </div>
  </div>
  );
};

export default DeviceFacePersonCard;
