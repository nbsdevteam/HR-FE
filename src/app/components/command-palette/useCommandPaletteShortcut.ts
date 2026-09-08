import { useEffect } from "react";

/** Ctrl/Cmd+K toggles the palette from anywhere in the app. */
export const useCommandPaletteShortcut = (onToggle: () => void): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);
};
