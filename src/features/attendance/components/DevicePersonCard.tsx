import { memo } from "react";
import { motion } from "motion/react";
import { CreditCard, Fingerprint, ScanFace, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DevicePerson } from "../types";
import { userTypeColor, userTypeLabel } from "../utils/deviceManagement";

type DevicePersonCardProps = {
  person: DevicePerson;
  index: number;
  facePhoto?: string;
};

const DevicePersonCard = ({ person, index, facePhoto }: DevicePersonCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.02 }}
    className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 overflow-hidden hover:border-primary/30 transition-all group"
  >
    <div className="relative h-36 bg-gradient-to-b from-muted/30 to-muted/10 flex items-center justify-center overflow-hidden">
      {facePhoto ? (
        <img
          src={`data:image/jpeg;base64,${facePhoto}`}
          alt={person.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center">
          <Users className="w-12 h-12 text-muted-foreground/20" />
          {person.numOfFace === 0 && (
            <span className="text-[10px] text-muted-foreground/40 mt-1">{arabicSource("devicemanagement.no_photo")}</span>
          )}
        </div>
      )}
      <span className="absolute top-2 start-2 text-xs font-mono bg-black/50 text-white px-1.5 py-0.5 rounded" dir="ltr">
        {person.employeeNo}
      </span>
      <span className={`absolute top-2 end-2 text-[10px] px-1.5 py-0.5 rounded border ${userTypeColor(person.userType)}`}>
        {userTypeLabel(person.userType)}
      </span>
    </div>

    <div className="p-3 space-y-2">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className={`flex items-center gap-0.5 ${person.numOfFP > 0 ? "text-emerald-400" : "text-muted-foreground/25"}`} title={arabicSource("common.fingerprint")}>
          <Fingerprint className="w-3.5 h-3.5" />
          <span className="text-xs">{person.numOfFP}</span>
        </div>
        <div className={`flex items-center gap-0.5 ${person.numOfFace > 0 ? "text-blue-400" : "text-muted-foreground/25"}`} title={arabicSource("common.face")}>
          <ScanFace className="w-3.5 h-3.5" />
          <span className="text-xs">{person.numOfFace}</span>
        </div>
        <div className={`flex items-center gap-0.5 ${person.numOfCard > 0 ? "text-amber-400" : "text-muted-foreground/25"}`} title={arabicSource("common.card")}>
          <CreditCard className="w-3.5 h-3.5" />
          <span className="text-xs">{person.numOfCard}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default memo(DevicePersonCard);
