import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import { PublicExitSignApiError } from "../api/publicExitSignApi";
import { MAX_SIGNATURE_BYTES, dataUrlBytes, publicExitSignErrorKey } from "./publicExitSign";

describe("dataUrlBytes", () => {
  it("measures the decoded image, not the text", () => {
    expect(dataUrlBytes("data:image/png;base64,QUJD")).toBe(3);
    expect(dataUrlBytes("data:image/png;base64,QUI=")).toBe(2);
    expect(dataUrlBytes("data:image/png;base64,QQ==")).toBe(1);
  });

  it("flags an image over the 300 KB the backend accepts", () => {
    const big = `data:image/png;base64,${"A".repeat(Math.ceil((MAX_SIGNATURE_BYTES * 4) / 3) + 8)}`;
    expect(dataUrlBytes(big)).toBeGreaterThan(MAX_SIGNATURE_BYTES);
  });
});

describe("publicExitSignErrorKey", () => {
  it("maps each backend code to its own message", () => {
    for (const [code, key] of [
      ["link_not_found", "public_exit_sign.error_link_not_found"],
      ["sign_link_closed", "public_exit_sign.error_link_closed"],
      ["signature_required", "public_exit_sign.error_signature_required"],
      ["sign_name_required", "public_exit_sign.error_name_required"],
      ["signature_invalid", "public_exit_sign.error_signature_invalid"],
      ["signature_too_large", "public_exit_sign.error_signature_too_large"],
      ["rate_limited", "public_exit_sign.error_rate_limited"],
      ["decision_required", "public_exit_sign.error_decision_required"],
    ] as const) {
      expect(arabicSource(publicExitSignErrorKey(new PublicExitSignApiError(code, "raw")))).toBe(arabicSource(key));
    }
  });

  it("falls back to the generic message for anything else", () => {
    expect(publicExitSignErrorKey(new Error("offline"))).toBe("public_exit_sign.error_generic");
    expect(publicExitSignErrorKey(new PublicExitSignApiError("weird", "raw"))).toBe("public_exit_sign.error_generic");
  });
});
