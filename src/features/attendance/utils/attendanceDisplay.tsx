import { CreditCard, Fingerprint, ScanFace, Smartphone } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow } from "../types";

export function verifyModeLabel(mode: string | null): string {
  if (!mode) return arabicSource("common.device");
  const m = mode.toLowerCase().trim();
  if (m.includes("fpandcardandpw") || (m.includes("fp") && m.includes("card"))) return arabicSource("attendance.fingerprint_card");
  if (m.includes("cardandpw") || (m.includes("card") && m.includes("pw"))) return arabicSource("attendance.card_token");
  if (m.includes("faceandcard")) return arabicSource("attendance.face_card");
  if (m.includes("fp") || m.includes("finger")) return arabicSource("common.fingerprint");
  if (m.includes("face")) return arabicSource("common.face");
  if (m.includes("card")) return arabicSource("common.card");
  if (m.includes("iris")) return arabicSource("attendance.iris");
  if (m.includes("pw") || m.includes("password")) return arabicSource("attendance.code");
  return arabicSource("common.device");
}

export function VerifyIcon({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const m = mode.toLowerCase();
  if (m.includes(arabicSource("common.face")) || m.includes("face")) return <ScanFace className="w-3.5 h-3.5 text-blue-400" />;
  if (m.includes(arabicSource("common.fingerprint")) || m.includes("finger") || m.includes("fp")) return <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />;
  if (m.includes(arabicSource("common.card")) || m.includes("card")) return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
  return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function statusDetail(row: AttendanceRow): string | null {
  if (row.rawStatus === "auto_checkout") return arabicSource("attendance.auto_exit");
  if (row.rawStatus === "missing_checkin") return arabicSource("attendance.no_entry");
  if (row.rawStatus === "checked_in") return arabicSource("attendance.did_not_log_out");
  if (row.rawStatus === "missing_checkout") return arabicSource("attendance.no_exit");
  return null;
}
