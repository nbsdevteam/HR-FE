import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ModalIntentId } from "./commands/types";

interface CommandIntentContextValue {
  pendingModalId: ModalIntentId | null;
  requestModal: (id: ModalIntentId) => void;
  consumeModal: (id: ModalIntentId) => boolean;
}

const CommandIntentContext = createContext<CommandIntentContextValue>({
  pendingModalId: null,
  requestModal: () => {},
  consumeModal: () => false,
});

export const useCommandIntent = () => {
  return useContext(CommandIntentContext);
};

/**
 * Lets the palette ask a page it just navigated to "open your Add X modal"
 * without a global modal registry: it sets a pending id, and the one
 * feature component that owns that modal's state consumes it (via a
 * `useEffect`) once it mounts.
 */
const CommandIntentProvider = ({ children }: { children: ReactNode }) => {
  const [pendingModalId, setPendingModalId] = useState<ModalIntentId | null>(null);

  const requestModal = useCallback((id: ModalIntentId) => setPendingModalId(id), []);

  const consumeModal = useCallback(
    (id: ModalIntentId): boolean => {
      if (pendingModalId !== id) return false;
      setPendingModalId(null);
      return true;
    },
    [pendingModalId],
  );

  // Declared after the useCallbacks above (not before, per the usual
  // useMemo-then-useCallback ordering) because it closes over them directly —
  // same deviation as NavShellContext's own context-value memo.
  const value = useMemo(
    () => ({ pendingModalId, requestModal, consumeModal }),
    [pendingModalId, requestModal, consumeModal],
  );

  return <CommandIntentContext.Provider value={value}>{children}</CommandIntentContext.Provider>;
};

export default CommandIntentProvider;
