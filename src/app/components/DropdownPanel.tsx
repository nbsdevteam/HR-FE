import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

type DropdownPanelProps = {
  isOpen: boolean;
  widthClassName: string;
  children: ReactNode;
};

/**
 * Shared TopBar dropdown panel — animated position/sizing/card chrome,
 * factored out of the near-identical versions UserMenuDropdown,
 * NotificationsDropdown, and DeviceStatusDropdown each built independently.
 * Pass `widthClassName` for the panel's width (the one thing that varies);
 * everything else (position, motion, card styling) is fixed.
 */
const DropdownPanel = ({ isOpen, widthClassName, children }: DropdownPanelProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        className={`absolute top-full mt-2 end-0 ${widthClassName} max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]`}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default DropdownPanel;
