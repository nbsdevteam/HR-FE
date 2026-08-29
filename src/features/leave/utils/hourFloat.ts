/** `"13:30"` → `13.5`. Returns `null` for an empty or malformed value. */
export const timeToFloat = (time: string): number | null => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h + m / 60;
};

/** `13.5` → `"13:30"` — the backend's 24h float clock rendered for display. */
export const formatHourFloat = (hour: number): string => {
  const hours = Math.floor(hour);
  const minutes = Math.round((hour - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
