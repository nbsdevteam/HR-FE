import { useCallback, useState } from "react";
import { arabicSource } from "@/i18n/source";
import { publicLeaveErrorMessage } from "../utils/publicLeaveErrorMessage";

/**
 * Holds the identity-confirmation value (employee code / birthday / phone
 * last 4) and gates it behind an explicit "confirm" action — never resent on
 * keystroke, per backend hand-off §4. `attempt` runs whatever call actually
 * needs the value (balances for the request flow, status for the track
 * flow) and only reports success when that call didn't come back with a
 * verification_* error.
 */
export const usePublicLeaveVerification = () => {
  const [value, setValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const attempt = useCallback(async (run: (verification: string | undefined) => Promise<unknown>): Promise<boolean> => {
    setVerifying(true);
    setError("");
    try {
      await run(value.trim() || undefined);
      setVerifying(false);
      return true;
    } catch (caught) {
      setError(publicLeaveErrorMessage(caught, arabicSource("public_leave.error_generic")));
      setVerifying(false);
      return false;
    }
  }, [value]);

  const reset = useCallback(() => {
    setValue("");
    setError("");
  }, []);

  return { attempt, error, reset, setValue, value, verifying };
};
