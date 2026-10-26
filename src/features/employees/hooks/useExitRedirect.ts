import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";
import { exitRedirectFromError, exitRedirectSearch, type ExitRedirect } from "../utils/exitRedirect";

export type ExitRedirectTarget = { redirect: ExitRedirect; employeeName: string };

/**
 * Hands an employee action the backend refused (`use_end_of_service` /
 * `exit_process_open`) over to the End of Service screen. `requestRedirect`
 * resolves true when the error was one of those, so the caller knows not to
 * report it as a failure; the dialog it opens does the navigating.
 */
export const useExitRedirect = () => {
  const [target, setTarget] = useState<ExitRedirectTarget | null>(null);
  const navigate = useNavigate();

  const requestRedirect = useCallback((error: unknown, employeeId: string, employeeName: string): boolean => {
    const redirect = exitRedirectFromError(error, employeeId);
    if (!redirect) return false;
    setTarget({ redirect, employeeName });
    return true;
  }, []);

  const closeRedirect = useCallback((): void => setTarget(null), []);

  const confirmRedirect = useCallback((): void => {
    if (!target) return;
    navigate({ pathname: `/${ROUTE_SEGMENT.lifecycle}`, search: exitRedirectSearch(target.redirect) });
    setTarget(null);
  }, [navigate, target]);

  return { closeRedirect, confirmRedirect, requestRedirect, redirectTarget: target };
};

/** Direct links into the End of Service screen, for the profile's Life cycle actions. */
export const useExitNavigation = () => {
  const navigate = useNavigate();

  const openExit = useCallback((exitId: string): void => {
    navigate({ pathname: `/${ROUTE_SEGMENT.lifecycle}`, search: exitRedirectSearch({ kind: "open", exitId, exitStatus: null }) });
  }, [navigate]);

  const startExit = useCallback((employeeId: string): void => {
    navigate({ pathname: `/${ROUTE_SEGMENT.lifecycle}`, search: exitRedirectSearch({ kind: "start", employeeId }) });
  }, [navigate]);

  return { openExit, startExit };
};
