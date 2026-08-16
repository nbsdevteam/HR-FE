import { CreditCard, Fingerprint, ScanFace } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type DeviceCredentialIconsProps = {
  fp: number;
  face: number;
  card: number;
};

export const DeviceCredentialIcons = ({ fp, face, card }: DeviceCredentialIconsProps) => (
  <div className="flex items-center gap-2">
    {fp > 0 && (
      <div className="flex items-center gap-0.5 text-emerald-400" title={`${fp} ${arabicSource("common.fingerprint")}`}>
        <Fingerprint className="w-3.5 h-3.5" /><span className="text-xs">{fp}</span>
      </div>
    )}
    {face > 0 && (
      <div className="flex items-center gap-0.5 text-blue-400" title={`${face} ${arabicSource("common.face")}`}>
        <ScanFace className="w-3.5 h-3.5" /><span className="text-xs">{face}</span>
      </div>
    )}
    {card > 0 && (
      <div className="flex items-center gap-0.5 text-amber-400" title={`${card} ${arabicSource("common.card")}`}>
        <CreditCard className="w-3.5 h-3.5" /><span className="text-xs">{card}</span>
      </div>
    )}
    {fp === 0 && face === 0 && card === 0 && (
      <span className="text-xs text-muted-foreground/50">{arabicSource("devicemanagement.no_data")}</span>
    )}
  </div>
);
