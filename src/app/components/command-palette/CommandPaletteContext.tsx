import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface CommandPaletteContextValue {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  isOpen: false,
  openPalette: () => {},
  closePalette: () => {},
  togglePalette: () => {},
});

export const useCommandPalette = () => {
  return useContext(CommandPaletteContext);
};

const CommandPaletteProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);
  const togglePalette = useCallback(() => setIsOpen((value) => !value), []);

  // Declared after the useCallbacks above (not before, per the usual
  // useMemo-then-useCallback ordering) because it closes over them directly —
  // same deviation as NavShellContext's own context-value memo.
  const value = useMemo(
    () => ({ isOpen, openPalette, closePalette, togglePalette }),
    [isOpen, openPalette, closePalette, togglePalette],
  );

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
};

export default CommandPaletteProvider;
