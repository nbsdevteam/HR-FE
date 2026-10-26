import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ArabicSourceKey } from "@/i18n/source";
import { decidePublicExitSign, openPublicExitSign, PublicExitSignApiError } from "../api/publicExitSignApi";
import type { PublicExitSignInfo } from "../types/publicExitSign";
import { dataUrlBytes, MAX_SIGNATURE_BYTES, publicExitSignErrorKey } from "../utils/publicExitSign";

export type PublicExitSignOutcome = "signed" | "declined";

/**
 * The employee's signing page. Opening the link records a view, so it is read
 * once and never refetched on focus; a bad or replaced link will not succeed on
 * a second try either, so there is no retry.
 */
export const usePublicExitSignPage = (token: string) => {
  const [typedName, setTypedName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<PublicExitSignOutcome | null>(null);
  const [errorKey, setErrorKey] = useState<ArabicSourceKey | null>(null);

  const query = useQuery<PublicExitSignInfo, Error>({
    queryKey: ["publicExitSign", token],
    queryFn: () => openPublicExitSign(token),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const send = useCallback(async (run: () => Promise<unknown>, result: PublicExitSignOutcome): Promise<void> => {
    setSubmitting(true);
    setErrorKey(null);
    try {
      await run();
      setOutcome(result);
    } catch (error: unknown) {
      setErrorKey(publicExitSignErrorKey(error));
    }
    setSubmitting(false);
  }, []);

  const handleSign = useCallback(async (): Promise<void> => {
    const name = typedName.trim();
    if (!name) return setErrorKey("public_exit_sign.error_name_required");
    if (!signature) return setErrorKey("public_exit_sign.error_signature_required");
    if (dataUrlBytes(signature) > MAX_SIGNATURE_BYTES) return setErrorKey("public_exit_sign.error_signature_too_large");
    await send(
      () => decidePublicExitSign(token, { accept: true, typedName: name, signatureImage: signature, notes: notes.trim() || undefined }),
      "signed",
    );
  }, [notes, send, signature, token, typedName]);

  const handleDecline = useCallback(async (): Promise<void> => {
    await send(
      () => decidePublicExitSign(token, { accept: false, typedName: typedName.trim(), notes: notes.trim() || undefined }),
      "declined",
    );
  }, [notes, send, token, typedName]);

  return {
    errorKey,
    handleDecline,
    handleSign,
    info: query.data ?? null,
    loadErrorKey: query.error
      ? publicExitSignErrorKey(query.error instanceof PublicExitSignApiError ? query.error : new Error("invalid_link"))
      : null,
    loading: query.isFetching,
    notes,
    outcome,
    setNotes,
    setSignature,
    setTypedName,
    submitting,
    typedName,
  };
};
