import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const CARD_TONE =
  "bg-card border border-border/60 hover:border-primary/30 text-foreground shadow-sm";

type HeaderActionButtonProps = {
  icon: LucideIcon;
  onClick: () => void;
  title?: string;
  /** Full replacement for the button's colour/border classes. */
  toneClassName?: string;
  paddingClassName?: string;
  /** Collapse to an icon-only button below the `sm` breakpoint. */
  hideLabelOnMobile?: boolean;
  children: ReactNode;
};

/**
 * Secondary action in the hierarchy page header. The shared `Button` covers the
 * primary/outline shapes but not this card-on-card tone, which several header
 * actions repeat.
 */
const HeaderActionButton = ({
  icon: Icon,
  onClick,
  title,
  toneClassName = CARD_TONE,
  paddingClassName = "px-4 py-2",
  hideLabelOnMobile = false,
  children,
}: HeaderActionButtonProps) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex items-center gap-1.5 rounded-lg transition-all ${paddingClassName} ${toneClassName}`}
    style={{ fontSize: 13 }}
  >
    <Icon className="w-4 h-4" />
    {hideLabelOnMobile ? (
      <span className="hidden sm:inline">{children}</span>
    ) : (
      children
    )}
  </button>
);

export default HeaderActionButton;
