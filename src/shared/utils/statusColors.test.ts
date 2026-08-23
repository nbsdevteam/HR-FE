import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATUS_COLOR,
  LIFECYCLE_PALETTE,
  SEVERITY_PALETTE,
  STATUS_TONES,
  buildStatusColorMap,
  buildStatusValueMap,
  getStatusColor,
} from "./statusColors";

describe("buildStatusColorMap", () => {
  it("assigns palette entries in order", () => {
    const map = buildStatusColorMap(["active", "expired", "cancelled"], LIFECYCLE_PALETTE);
    expect(map.active).toBe(STATUS_TONES.danger);
    expect(map.expired).toBe(STATUS_TONES.neutral);
    expect(map.cancelled).toBe(STATUS_TONES.success);
  });

  it("clamps to the last palette entry when there are more keys than colours", () => {
    // This is the behaviour the warnings/training config hooks relied on.
    const map = buildStatusColorMap(["a", "b", "c", "d", "e", "f", "g"], SEVERITY_PALETTE);
    expect(map.e).toBe(SEVERITY_PALETTE[4]);
    expect(map.f).toBe(SEVERITY_PALETTE[4]);
    expect(map.g).toBe(SEVERITY_PALETTE[4]);
  });

  it("returns an empty map when the palette is empty rather than undefined values", () => {
    expect(buildStatusColorMap(["a", "b"], [])).toEqual({});
  });

  it("returns an empty map for no keys", () => {
    expect(buildStatusColorMap([], LIFECYCLE_PALETTE)).toEqual({});
  });
});

describe("buildStatusValueMap", () => {
  it("works for non-colour values such as icons", () => {
    const map = buildStatusValueMap(["upcoming", "running", "done"], [1, 2, 3]);
    expect(map).toEqual({ upcoming: 1, running: 2, done: 3 });
  });

  it("clamps the same way as the colour variant", () => {
    const map = buildStatusValueMap(["a", "b", "c"], ["x"]);
    expect(map).toEqual({ a: "x", b: "x", c: "x" });
  });
});

describe("getStatusColor", () => {
  it("resolves known backend status codes", () => {
    expect(getStatusColor("active")).toBe(STATUS_TONES.success);
    expect(getStatusColor("expired")).toBe(STATUS_TONES.danger);
    expect(getStatusColor("in_progress")).toBe(STATUS_TONES.warning);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(getStatusColor("  ACTIVE ")).toBe(STATUS_TONES.success);
  });

  it("falls back to the neutral tone for unknown or empty statuses", () => {
    expect(getStatusColor("brand_new_status")).toBe(DEFAULT_STATUS_COLOR);
    expect(getStatusColor(null)).toBe(DEFAULT_STATUS_COLOR);
    expect(getStatusColor(undefined)).toBe(DEFAULT_STATUS_COLOR);
    expect(getStatusColor("")).toBe(DEFAULT_STATUS_COLOR);
  });

  it("prefers a caller override over the canonical mapping", () => {
    expect(getStatusColor("active", { active: STATUS_TONES.purple })).toBe(STATUS_TONES.purple);
  });

  it("matches an override on the raw status before lowercasing it", () => {
    // Feature palettes are keyed by localized labels, which are not lowercase.
    const overrides = { "قيد التنفيذ": STATUS_TONES.info };
    expect(getStatusColor("قيد التنفيذ", overrides)).toBe(STATUS_TONES.info);
  });
});
