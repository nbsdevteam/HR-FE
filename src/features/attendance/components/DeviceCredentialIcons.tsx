import { CreditCard, Fingerprint, ScanFace } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type DeviceCredentialIconsProps = {
  fp: number;
  face: number;
  card: number;
  /** When true, always renders all three icons dimmed instead of hiding zero counts (no "no data" fallback). */
  dimZero?: boolean;
};

const DeviceCredentialIcons = ({ fp, face, card, dimZero = false }: DeviceCredentialIconsProps) => (
  <div className={`flex items-center ${dimZero ? "gap-3" : "gap-2"}`}>
    {(dimZero || fp > 0) && (
      <div
        className={`flex items-center gap-0.5 ${fp > 0 ? "text-emerald-400" : "text-muted-foreground/25"}`}
        title={dimZero ? arabicSource("common.fingerprint") : `${fp} ${arabicSource("common.fingerprint")}`}
      >
        <Fingerprint className="w-3.5 h-3.5" /><span className="text-xs">{fp}</span>
      </div>
    )}
    {(dimZero || face > 0) && (
      <div
        className={`flex items-center gap-0.5 ${face > 0 ? "text-blue-400" : "text-muted-foreground/25"}`}
        title={dimZero ? arabicSource("common.face") : `${face} ${arabicSource("common.face")}`}
      >
        <ScanFace className="w-3.5 h-3.5" /><span className="text-xs">{face}</span>
      </div>
    )}
    {(dimZero || card > 0) && (
      <div
        className={`flex items-center gap-0.5 ${card > 0 ? "text-amber-400" : "text-muted-foreground/25"}`}
        title={dimZero ? arabicSource("common.card") : `${card} ${arabicSource("common.card")}`}
      >
        <CreditCard className="w-3.5 h-3.5" /><span className="text-xs">{card}</span>
      </div>
    )}
    {!dimZero && fp === 0 && face === 0 && card === 0 && (
      <span className="text-xs text-muted-foreground/50">{arabicSource("devicemanagement.no_data")}</span>
    )}
  </div>
);

export default DeviceCredentialIcons;
