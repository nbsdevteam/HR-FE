/** First letter of up to the first two words of a display name (e.g. "abbas mazin" → "AM"). */
export const employeeInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
