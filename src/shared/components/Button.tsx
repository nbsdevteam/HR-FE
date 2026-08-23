import { motion, type HTMLMotionProps } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "info"
  | "unstyled";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "leading" | "trailing";
  loading?: boolean;
  /**
   * Corner rounding utility. Override for segmented controls, where the shared
   * `rounded-lg` would fight a `rounded-none`/`rounded-s-lg` passed via
   * `className` (both are corner utilities, so which wins depends on CSS source
   * order, not attribute order).
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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
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

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
  // Square padding for icon-only actions, which the horizontal sizes distort.
  icon: "p-2",
};

/**
 * Generic button primitive — variant/size driven, so features stop hand-rolling
 * their own one-off "Button" components for plain styled actions.
 */
const Button = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "leading",
  loading = false,
  rounded = "rounded-lg",
  motionProps,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) => {
  const classes = `inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${rounded} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  const content = (
    <>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === "leading" && <Icon className="w-4 h-4" />}
      {children}
      {!loading && Icon && iconPosition === "trailing" && <Icon className="w-4 h-4" />}
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

export default Button;
