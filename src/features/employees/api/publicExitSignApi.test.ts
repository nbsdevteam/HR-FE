import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_BASE", "https://hr.example.test");
const { decidePublicExitSign, mapPublicExitSignInfo, openPublicExitSign, PublicExitSignApiError } = await import("./publicExitSignApi");

const respond = (result: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({ json: async () => ({ result }) } as Response);

describe("public End of Service signing API", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("sends no Authorization header and unwraps data", async () => {
    const spy = respond({ success: true, data: { state: "sent", employee_name: "Suraj", clearance: [], settlement: { lines: [], totals: {} } } });

    const info = await openPublicExitSign("tok");

    const [, init] = spy.mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
    expect(info.state).toBe("sent");
    expect(info.employeeName).toBe("Suraj");
  });

  it("reads only the state when the link is closed", () => {
    const info = mapPublicExitSignInfo({ state: "signed", decided_at: "2026-11-02T10:00:00+03:00" });
    expect(info).toMatchObject({ state: "signed", decidedAt: "2026-11-02T10:00:00+03:00", clearance: [], settlement: null });
  });

  it("surfaces the backend error_code", async () => {
    respond({ success: false, error_code: "sign_link_closed", link_state: "expired" });

    await expect(decidePublicExitSign("tok", { accept: true, typedName: "A", signatureImage: "data:image/png;base64,AA==" }))
      .rejects.toMatchObject({ code: "sign_link_closed", details: expect.objectContaining({ link_state: "expired" }) });
    expect(PublicExitSignApiError).toBeTypeOf("function");
  });

  it("sends the signature only when accepting", async () => {
    const spy = respond({ success: true, data: {} });

    await decidePublicExitSign("tok", { accept: false, typedName: "A", notes: "disagree" });

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.params).toEqual({ token: "tok", accept: false, typed_name: "A", notes: "disagree" });
  });
});
