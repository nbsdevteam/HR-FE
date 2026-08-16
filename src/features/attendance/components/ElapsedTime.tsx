import { arabicSource } from "@/i18n/source";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ElapsedTime({ checkIn }: { checkIn: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const parts = checkIn.split(":");
  const checkInMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
  // Get current Iraq time using Intl (handles DST correctly)
  const iraqTimeStr = new Date(now).toLocaleTimeString("en-GB", { timeZone: "Asia/Baghdad", hour12: false });
  const iraqParts = iraqTimeStr.split(":");
  const nowMinutes = parseInt(iraqParts[0], 10) * 60 + parseInt(iraqParts[1], 10);
  const elapsed = Math.max(0, nowMinutes - checkInMinutes);
  const hrs = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const label = hrs > 0 ? `${hrs}:${String(mins).padStart(2, "0")}` : `${mins}${arabicSource("attendance.d")}`;

  return (
    <div className="flex items-center justify-center gap-1" dir="ltr">
      <span className="text-emerald-500 font-mono animate-pulse" style={{ fontSize: 13 }}>{label}</span>
      <TrendingUp className="w-3 h-3 text-emerald-400" />
    </div>
  );
}