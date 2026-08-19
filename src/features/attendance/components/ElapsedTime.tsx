import { arabicSource } from "@/i18n/source";
import { TrendingUp } from "lucide-react";
import { useSyncExternalStore } from "react";

// Get current Iraq time using Intl (handles DST correctly)
const computeIraqNowMinutes = (): number => {
  const [hours, minutes] = new Date()
    .toLocaleTimeString("en-GB", { timeZone: "Asia/Baghdad", hour12: false })
    .split(":");
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
};

let iraqNowMinutes = computeIraqNowMinutes();
const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

// One shared 60s clock for every ElapsedTime instance instead of one setInterval per row.
const subscribeToIraqNow = (callback: () => void) => {
  subscribers.add(callback);
  if (subscribers.size === 1) {
    intervalId = setInterval(() => {
      iraqNowMinutes = computeIraqNowMinutes();
      subscribers.forEach((cb) => cb());
    }, 60_000);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};

const getIraqNowMinutesSnapshot = () => iraqNowMinutes;

const useIraqNowMinutes = () => useSyncExternalStore(subscribeToIraqNow, getIraqNowMinutesSnapshot);

const ElapsedTime = ({ checkIn }: { checkIn: string }) => {
  const nowMinutes = useIraqNowMinutes();

  const parts = checkIn.split(":");
  const checkInMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
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
};

export default ElapsedTime;