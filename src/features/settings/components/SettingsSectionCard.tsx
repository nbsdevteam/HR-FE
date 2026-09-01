import {
  useCallback,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { Maximize2 } from "lucide-react";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import { cardCls } from "../styles";

type TSettingsSectionCardProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Section-level buttons (e.g. "add type"); shown in the open dialog only. */
  actions?: ReactNode;
  delay?: number;
  /** Override the dialog card's className — e.g. a wider `max-w` for a table + editor section. */
  modalContentClassName?: string;
  /** Called when the dialog opens — lets a caller defer its own data fetch until then. */
  onOpen?: () => void;
  /** Called after the dialog closes, in addition to resetting `isOpen` — lets a caller reset its own state (e.g. a selected row). */
  onClose?: () => void;
  children: ReactNode;
};

/** Fixed height so every tile in the grid lines up, whatever its text length. */
const CARD_CLASS = `${cardCls} h-28 w-full flex items-center gap-3 text-start cursor-pointer hover:border-primary/40 hover:bg-card/50 transition-colors`;

const TITLE_STYLE: CSSProperties = {
  fontSize: "var(--text-lg)",
  fontWeight: "var(--font-weight-medium)",
  lineHeight: 1.5,
};

const MODAL_CONTENT_CLASS =
  "bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden";

/**
 * Opacity-only entrance: a transform on the dialog card would make it the
 * containing block for the `position: fixed` modals some sections render from
 * their body (leave-link form, delete confirms, device-sync pause), which would
 * leave those trapped inside this dialog instead of covering the viewport.
 */
const MODAL_CONTENT_MOTION: HTMLMotionProps<"div"> = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const SettingsSectionCard = ({
  icon: Icon,
  title,
  description,
  actions,
  delay = 0,
  modalContentClassName,
  onOpen,
  onClose,
  children,
}: TSettingsSectionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback((): void => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return (
    <>
      <motion.button
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={CARD_CLASS}
      >
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {/* A heading element is not valid inside a button, so this mirrors the h3 rule in theme.css. */}
          <span
            className="block text-foreground line-clamp-1"
            style={TITLE_STYLE}
            title={title}
          >
            {title}
          </span>
          {description && (
            <p
              className="text-muted-foreground mt-1 line-clamp-2"
              style={{ fontSize: 12 }}
              title={description}
            >
              {description}
            </p>
          )}
        </div>
        <Maximize2 className="w-4 h-4 text-muted-foreground/60 shrink-0" />
      </motion.button>

      {isOpen && (
        <ModalOverlay
          onClose={handleClose}
          contentClassName={modalContentClassName ?? MODAL_CONTENT_CLASS}
          contentMotionProps={MODAL_CONTENT_MOTION}
        >
          <ModalHeader
            icon={Icon}
            title={title}
            subtitle={description}
            onClose={handleClose}
          />
          {actions && (
            <div className="px-6 py-3 border-b border-border/30 flex items-center justify-end gap-2 shrink-0">
              {actions}
            </div>
          )}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
        </ModalOverlay>
      )}
    </>
  );
};

export default SettingsSectionCard;
