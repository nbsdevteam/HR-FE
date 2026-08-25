import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components";

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
 * Secondary action in the hierarchy page header — composes the shared
 * `Button` (variant="unstyled") for this card-on-card tone, which several
 * header actions repeat but which isn't one of `Button`'s named variants.
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
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded-lg"
    onClick={onClick}
    title={title}
    className={`gap-1.5 ${paddingClassName} ${toneClassName}`}
    style={{ fontSize: 13 }}
  >
    <Icon className="w-4 h-4" />
    {hideLabelOnMobile ? (
      <span className="hidden sm:inline">{children}</span>
    ) : (
      children
    )}
  </Button>
);

export default HeaderActionButton;
