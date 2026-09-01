import { useEffect, useState } from "react";

export const useChartTheme = () => {
  const [colors, setColors] = useState({
    primary: "#D4AF37",
    card: "#1A1A1A",
    border: "rgba(212,175,55,0.2)",
    muted: "#A0A0A0",
    gridStroke: "rgba(212,175,55,0.1)",
  });

  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      setColors({
        primary: style.getPropertyValue("--primary").trim() || "#D4AF37",
        card: style.getPropertyValue("--card").trim() || "#1A1A1A",
        border: style.getPropertyValue("--border").trim() || "rgba(212,175,55,0.2)",
        muted: style.getPropertyValue("--muted-foreground").trim() || "#A0A0A0",
        gridStroke: style.getPropertyValue("--border").trim() || "rgba(212,175,55,0.1)",
      });
    };

    update();

    // Observe class changes on html element for theme switches
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const tooltipStyle = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontFamily: "Tajawal",
    color: "var(--foreground)",
  };

  return { colors, tooltipStyle };
};

/**
 * Layout constants shared by the custom-*-chart SVG components. Extracted
 * because bar/grouped-bar/line charts each redeclared the same width/tick
 * numbers independently (padding-bottom is the one axis that legitimately
 * varies per chart, so it stays a per-file constant).
 */
export const CHART_WIDTH = 600;
export const CHART_PADDING_LEFT = 50;
export const CHART_PADDING_RIGHT = 16;
export const CHART_TICK_COUNT = 5;

export type ChartTick = { value: number; y: number };

/** Round a max value up to the nearest `step`, e.g. bar charts use step 10, grouped bars use 50. */
export const niceMax = (maxValue: number, step = 10): number =>
  Math.max(step, Math.ceil(maxValue / step) * step);

/**
 * Nice min/max for a series that can go below zero (line charts) — pads the
 * range by ~10% on each end so the plotted line doesn't touch the axes.
 */
export const niceRange = (minValue: number, maxValue: number, step = 10): { niceMin: number; niceMax: number } => {
  const range = maxValue - minValue;
  const pad = Math.max(step, Math.ceil(range * 0.1));
  return {
    niceMin: Math.floor(minValue / step) * step - pad,
    niceMax: Math.ceil(maxValue / step) * step + pad,
  };
};

/** Build the evenly-spaced Y-axis ticks between `min` and `max`, mapped to plot-space via `getY`. */
export const buildYTicks = (
  min: number,
  max: number,
  tickCount: number,
  getY: (value: number) => number,
): ChartTick[] => {
  const span = max - min;
  return Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = Math.round(min + (span / tickCount) * index);
    return { value, y: getY(value) };
  });
};

/* ---------------------------------------------------------------------------
 * X-axis label layout
 *
 * Long department/organisation names collide with their neighbours when every
 * label is drawn as a single centred line. `buildAxisLabelLayout` picks one
 * mode for the whole axis (so the chart stays visually consistent) based on how
 * much horizontal room each bar slot actually has:
 *   horizontal -> every label fits on one line
 *   wrapped    -> labels split across 2 lines without losing any word
 *   rotated    -> slots are too narrow, tilt the labels and ellipsise the rest
 * ------------------------------------------------------------------------- */

export const AXIS_LABEL_FONT_SIZE = 10;
export const AXIS_LABEL_LINE_HEIGHT = 11;
export const AXIS_LABEL_ROTATION = -35;

/** Horizontal breathing room kept between two neighbouring labels. */
const AXIS_LABEL_GAP = 8;
/** Below this slot width wrapping produces unreadable 2-3 character lines. */
const MIN_WRAP_SLOT_WIDTH = 40;
/** Rotated labels run diagonally, so they may be longer than a bar slot. */
const ROTATED_LABEL_MAX_WIDTH = 70;
/** Average glyph width as a ratio of the font size (Tajawal, mixed ar/en). */
const CHAR_WIDTH_RATIO = 0.55;

const AXIS_PADDING_BOTTOM = { horizontal: 44, wrapped: 58, rotated: 74 } as const;

export type AxisLabelMode = keyof typeof AXIS_PADDING_BOTTOM;

export type AxisLabelLayout = {
  mode: AxisLabelMode;
  /** One entry per label, each already split into the lines to render. */
  lines: string[][];
  /** Bottom padding the chart must reserve so the labels are never clipped. */
  paddingBottom: number;
  rotation: number;
};

const measureText = (text: string): number => text.length * AXIS_LABEL_FONT_SIZE * CHAR_WIDTH_RATIO;

const truncateToWidth = (text: string, maxWidth: number): string => {
  if (measureText(text) <= maxWidth) return text;
  const maxChars = Math.max(1, Math.floor(maxWidth / (AXIS_LABEL_FONT_SIZE * CHAR_WIDTH_RATIO)) - 1);
  return `${text.slice(0, maxChars).trimEnd()}…`;
};

const wrapToLines = (text: string, maxWidth: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measureText(candidate) <= maxWidth) {
      current = candidate;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncateToWidth(`${kept[maxLines - 1]} ${lines.slice(maxLines).join(" ")}`, maxWidth);
  return kept;
};

export const buildAxisLabelLayout = (labels: string[], slotWidth: number): AxisLabelLayout => {
  const available = Math.max(1, slotWidth - AXIS_LABEL_GAP);

  if (labels.every((label) => measureText(label) <= available)) {
    return {
      mode: "horizontal",
      lines: labels.map((label) => [label]),
      paddingBottom: AXIS_PADDING_BOTTOM.horizontal,
      rotation: 0,
    };
  }

  const wrapped = labels.map((label) => wrapToLines(label, available, 2));
  const wrapKeepsEveryWord = wrapped.every(
    (lines, index) => lines.join(" ") === labels[index].split(/\s+/).filter(Boolean).join(" "),
  );

  if (available >= MIN_WRAP_SLOT_WIDTH && wrapKeepsEveryWord) {
    return { mode: "wrapped", lines: wrapped, paddingBottom: AXIS_PADDING_BOTTOM.wrapped, rotation: 0 };
  }

  return {
    mode: "rotated",
    lines: labels.map((label) => [truncateToWidth(label, ROTATED_LABEL_MAX_WIDTH)]),
    paddingBottom: AXIS_PADDING_BOTTOM.rotated,
    rotation: AXIS_LABEL_ROTATION,
  };
};
