/** `changed_at` carries an explicit +03:00 offset — Date already resolves it correctly. */
export const formatDeviceSyncChangedAt = (changedAt: string): string => {
  const date = new Date(changedAt);
  if (Number.isNaN(date.getTime())) return changedAt;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
