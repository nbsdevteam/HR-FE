import { getIntlLocale } from "./index";

export type DateInput = Date | string | number;

function asDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export const formatDate = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(asDate(value));
}

export const formatDateTime = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  return formatDate(value, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

export const formatTime = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    timeStyle: "short",
    ...options,
  }).format(asDate(value));
}

export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {},
): string => {
  return new Intl.NumberFormat(getIntlLocale(), options).format(value);
}

export const formatPercent = (
  value: number,
  options: Intl.NumberFormatOptions = {},
): string => {
  return formatNumber(value, {
    style: "percent",
    ...options,
  });
}

export const formatCurrency = (
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
): string => {
  return formatNumber(value, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    ...options,
  });
}
