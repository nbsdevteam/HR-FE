/**
 * Single source of truth for status → badge colour.
 *
 * `src/i18n/status.ts` already centralises status *labels*; this is the missing
 * counterpart for status *colours*, which had drifted into five independent
 * copies (warnings, training, evaluation, employee lifecycle, leave cards) that
 * each re-declared the same Tailwind strings and each re-implemented the same
 * "assign palette entry by index" loop.
 */

/** Semantic badge tokens — the vocabulary every status palette is built from. */
export const STATUS_TONES = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  danger: "bg-destructive/10 border-destructive/20 text-destructive",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  accent: "bg-primary/10 border-primary/20 text-primary",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  neutral: "bg-muted/30 border-border text-muted-foreground",
  muted: "bg-muted/20 border-muted/30 text-muted-foreground",
  redSoft: "bg-red-400/10 border-red-400/20 text-red-400",
  redStrong: "bg-red-600/10 border-red-600/20 text-red-500",
} as const;

export type StatusTone = keyof typeof STATUS_TONES;

/** Fallback used whenever a status has no mapping — never return an empty class. */
export const DEFAULT_STATUS_COLOR = STATUS_TONES.neutral;

/**
 * Build a `status -> colour` map by walking an ordered status list against an
 * ordered palette, clamping at the last entry. This is the loop that had been
 * copy-pasted into `useWarningConfig` and `useTrainingConfig`.
 */
export const buildStatusColorMap = (
  keys: readonly string[],
  palette: readonly string[],
): Record<string, string> => {
  const map: Record<string, string> = {};
  if (palette.length === 0) return map;
  keys.forEach((key, index) => {
    map[key] = palette[Math.min(index, palette.length - 1)];
  });
  return map;
};

/**
 * Same index-clamped walk, but for any per-status value (icons, weights, …).
 * Keeps `useTrainingConfig`'s icon map on the shared implementation too.
 */
export const buildStatusValueMap = <T,>(
  keys: readonly string[],
  palette: readonly T[],
): Record<string, T> => {
  const map: Record<string, T> = {};
  if (palette.length === 0) return map;
  keys.forEach((key, index) => {
    map[key] = palette[Math.min(index, palette.length - 1)];
  });
  return map;
};

/** Ordered severity ramp: mildest → most severe (warning types, escalations). */
export const SEVERITY_PALETTE: readonly string[] = [
  STATUS_TONES.info,
  STATUS_TONES.accent,
  STATUS_TONES.redSoft,
  STATUS_TONES.redStrong,
  STATUS_TONES.danger,
];

/** Ordered lifecycle ramp: active → finished → cancelled. */
export const LIFECYCLE_PALETTE: readonly string[] = [
  STATUS_TONES.danger,
  STATUS_TONES.neutral,
  STATUS_TONES.success,
];

/** Ordered progress ramp: upcoming → running → done → dropped. */
export const PROGRESS_PALETTE: readonly string[] = [
  STATUS_TONES.info,
  STATUS_TONES.warning,
  STATUS_TONES.success,
  STATUS_TONES.muted,
];

/**
 * Canonical colours for the backend status codes shared across features.
 * Mirrors the key space of `defaultLifecycleStatusLabels` in the employees
 * feature, so a status has one colour wherever it is rendered.
 */
export const STATUS_COLORS: Record<string, string> = {
  active: STATUS_TONES.success,
  approved: STATUS_TONES.success,
  completed: STATUS_TONES.success,
  passed: STATUS_TONES.success,
  valid: STATUS_TONES.success,
  finished: STATUS_TONES.success,

  pending: STATUS_TONES.accent,
  pending_review: STATUS_TONES.accent,
  initiated: STATUS_TONES.accent,
  draft: STATUS_TONES.accent,
  submitted: STATUS_TONES.accent,

  in_progress: STATUS_TONES.warning,
  expiring_soon: STATUS_TONES.warning,
  on_hold: STATUS_TONES.warning,

  renewed: STATUS_TONES.info,
  clearance: STATUS_TONES.info,
  scheduled: STATUS_TONES.info,

  settlement: STATUS_TONES.purple,

  expired: STATUS_TONES.danger,
  terminated: STATUS_TONES.danger,
  rejected: STATUS_TONES.danger,
  missing: STATUS_TONES.danger,
  failed: STATUS_TONES.danger,

  cancelled: STATUS_TONES.muted,
  canceled: STATUS_TONES.muted,
  withdrawn: STATUS_TONES.muted,
  waived: STATUS_TONES.muted,
};

/** Look up a canonical status colour, falling back to the neutral tone. */
export const getStatusColor = (
  status: string | null | undefined,
  overrides?: Record<string, string>,
): string => {
  if (!status) return DEFAULT_STATUS_COLOR;
  const key = status.trim().toLowerCase();
  return overrides?.[status] ?? overrides?.[key] ?? STATUS_COLORS[key] ?? DEFAULT_STATUS_COLOR;
};
