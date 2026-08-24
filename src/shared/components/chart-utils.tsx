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
