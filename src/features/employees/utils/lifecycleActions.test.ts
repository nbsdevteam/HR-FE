import { describe, expect, it } from "vitest";
import { canEditEndOfService, canStartEndOfService } from "./lifecycleActions";

describe("lifecycle action codes", () => {
  it("offers a start only for start_exit", () => {
    expect(canStartEndOfService(["start_exit"])).toBe(true);
    expect(canStartEndOfService(["edit_exit"])).toBe(false);
    expect(canStartEndOfService([])).toBe(false);
  });

  it("offers an edit only for edit_exit", () => {
    expect(canEditEndOfService(["edit_exit"])).toBe(true);
    expect(canEditEndOfService(["start_exit"])).toBe(false);
    expect(canEditEndOfService([])).toBe(false);
  });

  it("does not guess at similar codes", () => {
    expect(canStartEndOfService(["start_end_of_service"])).toBe(false);
    expect(canEditEndOfService(["edit_end_of_service"])).toBe(false);
  });
});
