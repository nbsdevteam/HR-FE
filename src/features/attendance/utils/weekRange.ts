import { getIntlLocale, normalizeLanguage, type AppLanguage } from "@/i18n";
import { todayInBaghdad } from "@/shared/utils/timezone";

export type WeekRange = {
  start: string;
  end: string;
};

/** Midday UTC keeps date math free of DST/timezone drift when only the calendar date matters. */
const parseAsUtcNoon = (dateStr: string): Date => new Date(`${dateStr}T12:00:00Z`);

const formatUtcDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Sunday–Saturday bounds for the week `weekOffset` weeks away from the
 * current Baghdad week (0 = this week, -1 = last week, ...).
 */
export const getWeekRange = (weekOffset: number): WeekRange => {
  const today = parseAsUtcNoon(todayInBaghdad());
  const dayOfWeek = today.getUTCDay();

  const sunday = new Date(today);
  sunday.setUTCDate(today.getUTCDate() - dayOfWeek + weekOffset * 7);

  const saturday = new Date(sunday);
  saturday.setUTCDate(sunday.getUTCDate() + 6);

  return { start: formatUtcDate(sunday), end: formatUtcDate(saturday) };
};

/** e.g. "Aug 24 – Aug 30" / localized equivalent, for the chart's week nav label. */
export const formatWeekRangeLabel = (
  range: WeekRange,
  language?: AppLanguage | string,
): string => {
  const formatter = new Intl.DateTimeFormat(getIntlLocale(normalizeLanguage(language)), {
    month: "short",
    day: "numeric",
  });
  const start = formatter.format(parseAsUtcNoon(range.start));
  const end = formatter.format(parseAsUtcNoon(range.end));
  return `${start} – ${end}`;
};
