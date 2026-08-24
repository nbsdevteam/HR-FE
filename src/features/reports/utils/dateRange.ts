/** First/last day (YYYY-MM-DD) of the current calendar month — the sane default for report date filters. */
export const getCurrentMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  return { from: fmt(first), to: fmt(last) };
};
