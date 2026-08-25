import { motion, type HTMLMotionProps } from "motion/react";
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "info"
  | "unstyled"
  | "toggle"
  | "chip";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "unstyled";
type StatefulButtonVariant = "toggle" | "chip";
type StaticButtonVariant = Exclude<ButtonVariant, StatefulButtonVariant>;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Selected/pressed state for the `toggle` and `chip` variants (a filter pill,
   * a segmented control option, a bordered selector card). Ignored by every
   * other variant, so it's safe to leave unset outside those two.
   */
  active?: boolean;
  icon?: IconComponent;
  iconPosition?: "leading" | "trailing";
  /** Classes for the leading/trailing icon and the loading spinner. */
  iconClassName?: string;
  loading?: boolean;
  /**
   * Corner rounding utility. Override for segmented controls, where the shared
   * `rounded-lg` would fight a `rounded-none`/`rounded-s-lg` passed via
   * `className` (both are corner utilities, so which wins depends on CSS source
   * order, not attribute order). Pass `""` alongside `variant="unstyled"` when
   * `className` already carries its own rounding, for the same reason.
   */
  rounded?: string;
  /**
   * When set, renders a `motion.button` with these props so call sites keep
   * their `whileHover`/`whileTap` press animation instead of hand-rolling the
   * whole button to get it.
   */
  motionProps?: HTMLMotionProps<"button">;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<StaticButtonVariant, string> = {
  // `gold-dark` is the app's established primary-CTA hover (a theme-aware token:
  // deeper gold in the dark theme, cyan in light-turquoise). Keeping it here
  // means call sites migrating off hand-rolled buttons don't lose it.
  primary: "bg-primary text-primary-foreground hover:bg-gold-dark",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-border text-foreground hover:bg-secondary",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
  // Tonal variants — translucent tint rather than a solid fill. Device controls
  // and status actions used these as hand-rolled buttons because the solid
  // variants above always inject their own background.
  success: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
  info: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
  // Contributes no colour at all, so `className` fully owns the look while the
  // button keeps the shared layout, sizing, disabled and loading behaviour.
  unstyled: "",
};

// `active`-aware variants for selectable UI (filter pills, segmented options,
// bordered chip selectors) that hand-rolled the same active/inactive ternary
// across a dozen features. `chip` always carries a hairline border; the
// ternary below only swaps its colour so the border never disappears.
const STATEFUL_VARIANT_CLASSES: Record<StatefulButtonVariant, { active: string; inactive: string; base?: string }> = {
  toggle: {
    active: "bg-primary text-primary-foreground",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  },
  chip: {
    base: "border",
    active: "border-primary/40 text-primary bg-primary/10",
    inactive: "border-border text-muted-foreground hover:border-primary/20",
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
  // Square padding for icon-only actions, which the horizontal sizes distort.
  icon: "p-2",
  // Contributes no padding/text-size/gap, so `className` fully owns them —
  // for callers with a bespoke size (e.g. a filter chip's own padding scale).
  unstyled: "",
};

const isStatefulVariant = (variant: ButtonVariant): variant is StatefulButtonVariant =>
  variant === "toggle" || variant === "chip";

/**
 * Generic button primitive — variant/size driven, so features stop hand-rolling
 * their own one-off "Button" components for plain styled actions. `toggle` and
 * `chip` (paired with `active`) additionally cover selectable pills/cards, and
 * `size="unstyled"` + `variant="unstyled"` + `rounded=""` cede full control to
 * `className` while still sharing layout, disabled, loading and icon behaviour.
 */
const Button = ({
  variant = "primary",
  size = "md",
  active = false,
  icon: Icon,
  iconPosition = "leading",
  iconClassName = "w-4 h-4",
  loading = false,
  rounded = "rounded-lg",
  motionProps,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) => {
  const variantClasses = isStatefulVariant(variant)
    ? `${STATEFUL_VARIANT_CLASSES[variant].base ?? ""} ${
        active ? STATEFUL_VARIANT_CLASSES[variant].active : STATEFUL_VARIANT_CLASSES[variant].inactive
      }`
    : VARIANT_CLASSES[variant];

  const classes = `inline-flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${rounded} ${variantClasses} ${SIZE_CLASSES[size]} ${className}`;

  const content = (
    <>
      {loading && <Loader2 className={`${iconClassName} animate-spin`} />}
      {!loading && Icon && iconPosition === "leading" && <Icon className={iconClassName} />}
      {children}
      {!loading && Icon && iconPosition === "trailing" && <Icon className={iconClassName} />}
    </>
  );

  if (motionProps) {
    return (
      <motion.button
        disabled={disabled || loading}
        className={classes}
        {...motionProps}
        {...(rest as HTMLMotionProps<"button">)}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button disabled={disabled || loading} className={classes} {...rest}>
      {content}
    </button>
  );
};

export type { ButtonProps, ButtonVariant, ButtonSize };
export default Button;
