import { describe, expect, it } from "vitest";
import { parseKeyLabelMap } from "./lifecycleConfig";

const defaults = { approval: "Approval", clearance: "Clearance" };

describe("parseKeyLabelMap", () => {
  it("returns the defaults when nothing is configured", () => {
    expect(parseKeyLabelMap("", defaults)).toBe(defaults);
    expect(parseKeyLabelMap(" , :x", defaults)).toBe(defaults);
  });

  it("merges configured labels onto the defaults instead of replacing them", () => {
    expect(parseKeyLabelMap("clearance: Disclaimer", defaults)).toEqual({
      approval: "Approval",
      clearance: "Disclaimer",
    });
  });
});
