import { describe, expect, it } from "vitest";
import { canEditEndOfService, canStartEndOfService } from "./lifecycleActions";

describe("lifecycle action codes", () => {
  it("recognises a start of End of Service", () => {
    expect(canStartEndOfService(["start_end_of_service"])).toBe(true);
    expect(canStartEndOfService(["start_exit"])).toBe(true);
    expect(canStartEndOfService(["edit_end_of_service"])).toBe(false);
    expect(canStartEndOfService([])).toBe(false);
  });

  it("recognises an edit of End of Service", () => {
    expect(canEditEndOfService(["edit_end_of_service"])).toBe(true);
    expect(canEditEndOfService(["open_exit"])).toBe(true);
    expect(canEditEndOfService(["start_end_of_service"])).toBe(false);
  });
});
