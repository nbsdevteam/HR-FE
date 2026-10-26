import { AnimatePresence } from "motion/react";
import type { RehireContractInput } from "@/shared/api/odooData";
import type { ExitRedirectTarget } from "../hooks/useExitRedirect";
import type { RehireState } from "../hooks/useEmployeeStatusActions";
import EmployeeRehireDialog from "./EmployeeRehireDialog";
import ExitRedirectDialog from "./ExitRedirectDialog";

type EmployeeActionDialogsProps = {
  exitRedirectTarget: ExitRedirectTarget | null;
  rehire: RehireState | null;
  rehireSaving: boolean;
  onExitRedirectConfirm: () => void;
  onExitRedirectClose: () => void;
  onRehireSubmit: (contract: RehireContractInput) => void;
  onRehireClose: () => void;
};

/** The two follow-ups to an employee action the backend redirected: End of Service, or a rehire contract. */
const EmployeeActionDialogs = ({
  exitRedirectTarget, rehire, rehireSaving, onExitRedirectConfirm, onExitRedirectClose, onRehireSubmit, onRehireClose,
}: EmployeeActionDialogsProps) => (
  <>
    <AnimatePresence>
      {exitRedirectTarget && (
        <ExitRedirectDialog target={exitRedirectTarget} onConfirm={onExitRedirectConfirm} onClose={onExitRedirectClose} />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {rehire && (
        <EmployeeRehireDialog state={rehire} saving={rehireSaving} onSubmit={onRehireSubmit} onClose={onRehireClose} />
      )}
    </AnimatePresence>
  </>
);

export default EmployeeActionDialogs;
