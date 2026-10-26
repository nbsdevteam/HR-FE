import { useCallback, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { ExitSigningLink } from "@/shared/hooks";
import { exitProcessErrorMessage } from "../utils/exitProcessErrorMessage";
import ExitSigningLinkActions from "./ExitSigningLinkActions";

type MyTaskSigningLinkProps = {
  exitId: string;
  onIssue: (exitId: string) => Promise<boolean>;
  busy: boolean;
};

/** The signing link for a `share_signature_link` task: copy, WhatsApp, open here, or issue a new one. */
const MyTaskSigningLink = ({ exitId, onIssue, busy }: MyTaskSigningLinkProps) => {
  const [signature, setSignature] = useState<ExitSigningLink | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { process } = await odooData.fetchExit(exitId);
      setSignature(process.signature);
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_decision_failed"));
    }
    setLoading(false);
  }, [exitId]);

  const handleIssue = useCallback(async (): Promise<void> => {
    if (await onIssue(exitId)) await load();
  }, [exitId, load, onIssue]);

  if (!signature) {
    return (
      <Button variant="outline" size="sm" icon={Link2} loading={loading} onClick={load} data-task-link-options>
        {arabicSource("lifecycle.task_link_options")}
      </Button>
    );
  }
  return <ExitSigningLinkActions signature={signature} canIssue busy={busy} onIssue={handleIssue} />;
};

export default MyTaskSigningLink;
