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
 * Trailing 7-day bounds ending `weekOffset` weeks away from today in Baghdad
 * (0 = the 7 days up to and including today, -1 = the 7 days before that, ...).
 * Anchored on today rather than the calendar Sunday–Saturday week so the
 * default view never reaches into future, not-yet-happened days.
 */
export const getWeekRange = (weekOffset: number): WeekRange => {
  const today = parseAsUtcNoon(todayInBaghdad());

  const end = new Date(today);
  end.setUTCDate(today.getUTCDate() + weekOffset * 7);

  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);

  return { start: formatUtcDate(start), end: formatUtcDate(end) };
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
