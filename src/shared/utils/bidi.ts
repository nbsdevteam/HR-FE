/**
 * Wraps a numeric/Latin fragment (e.g. "(8%)", "(12)") in Unicode
 * left-to-right isolate marks so it renders correctly inside the app's
 * forced-RTL document, without relying on surrounding text for bidi
 * resolution. Works in plain strings too (alerts, title attributes),
 * unlike a `dir="ltr"` span which only works in JSX.
 */
export const isolateLtr = (text: string): string => `⁦${text}⁩`;
