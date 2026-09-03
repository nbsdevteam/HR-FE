import type { ComponentType, ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";

type StatCardLayout = "row" | "center";
type StatCardDecoration = "none" | "blob" | "glow";

/** Pixel width below which `hideIconBelow` hides the icon. Tailwind's JIT scanner needs each
 * class literally in source, so this stays a fixed lookup rather than an interpolated string. */
type StatCardIconBreakpoint = 1000 | 1220;

const ICON_HIDDEN_BELOW_CLASS: Record<StatCardIconBreakpoint, string> = {
  1000: "hidden min-[1000px]:block",
  1220: "hidden min-[1220px]:block",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  index?: number;
  delayStep?: number;
  layout?: StatCardLayout;
  decoration?: StatCardDecoration;
  decorationClassName?: string;
  decorationSizeClassName?: string;
  hoverLift?: boolean;
  padding?: "p-4" | "p-5";
  cardClassName?: string;
  valueSize?: number;
  valueClassName?: string;
  valueMarginClassName?: string;
  labelSize?: number;
  iconBox?: boolean;
  iconBoxPadding?: string;
  iconBoxClassName?: string;
  iconClassName?: string;
  suffix?: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  dir?: "ltr";
  href?: string;
  hideIconBelow?: StatCardIconBreakpoint;
};

const MotionLink = motion.create(Link);

/** Animated icon+value card for stat grids. For a static colored tile use ColorStatTile; for an inline label:value row use LabeledMetricRow. */
const StatCard = ({
  label,
  value,
  icon: Icon,
  index = 0,
  delayStep = 0.1,
  layout = "row",
  decoration = "none",
  decorationClassName = "from-primary/10",
  decorationSizeClassName = "w-28 h-28",
  hoverLift = false,
  padding = "p-4",
  cardClassName = "bg-card backdrop-blur-sm border border-border",
  valueSize = 28,
  valueClassName = "text-gradient-gold",
  valueMarginClassName = "mt-1",
  labelSize = 13,
  iconBox = true,
  iconBoxPadding,
  iconBoxClassName = "bg-primary/10 border border-primary/20",
  iconClassName = "w-5 h-5 text-primary",
  suffix,
  sub,
  trailing,
  dir,
  href,
  hideIconBelow,
}: StatCardProps) => {
  const iconVisibilityClassName = hideIconBelow ? ICON_HIDDEN_BELOW_CLASS[hideIconBelow] : "";
  const icon = iconBox ? (
    <div
      className={`rounded-lg flex-shrink-0 ${iconVisibilityClassName} ${iconBoxPadding ?? (layout === "center" ? "p-2" : "p-2.5")} ${iconBoxClassName}`}
    >
      <Icon className={iconClassName} />
    </div>
  ) : (
    <Icon className={`${iconClassName} flex-shrink-0 ${iconVisibilityClassName}`} />
  );

  const decorationEl =
    decoration === "none" ? null : decoration === "blob" ? (
      <div
        className={`absolute top-0 end-0 ${decorationSizeClassName} bg-gradient-to-bl ${decorationClassName} to-transparent rounded-bl-full`}
      />
    ) : (
      <div
        className={`absolute inset-0 bg-gradient-to-br ${decorationClassName} via-transparent to-transparent w-28 pointer-events-none`}
      />
    );

  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * delayStep },
    whileHover: hoverLift
      ? { y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }
      : undefined,
    className: `relative ${cardClassName} rounded-xl ${padding} shadow-lg overflow-hidden ${hoverLift ? "hover:border-primary/30 transition-colors" : ""} ${href ? "cursor-pointer" : ""} ${layout === "center" ? "text-center" : ""}`,
  };

  const content = (
    <>
      {decorationEl}
      {layout === "center" ? (
        <>
          <div className="flex justify-center mb-2 relative z-10">{icon}</div>
          <p
            className="text-muted-foreground relative z-10"
            style={{ fontSize: labelSize }}
          >
            {label}
          </p>
          <span
            className={`block mt-1 relative z-10 ${valueClassName}`}
            style={{ fontSize: valueSize }}
          >
            {value}
          </span>
        </>
      ) : (
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="min-w-0">
            <p
              className="text-muted-foreground"
              style={{ fontSize: labelSize }}
            >
              {label}
            </p>
            {suffix || trailing ? (
              <div
                className={`flex items-baseline gap-1.5 ${valueMarginClassName}`}
              >
                <span
                  className={valueClassName}
                  style={{ fontSize: valueSize }}
                  dir={dir}
                >
                  {value}
                </span>
                {suffix && (
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    {suffix}
                  </span>
                )}
                {trailing}
              </div>
            ) : (
              <span
                className={`block ${valueMarginClassName} ${valueClassName}`}
                style={{ fontSize: valueSize }}
                dir={dir}
              >
                {value}
              </span>
            )}
            {sub && (
              <p
                className="text-muted-foreground mt-1"
                style={{ fontSize: 11 }}
              >
                {sub}
              </p>
            )}
          </div>
          {icon}
        </div>
      )}
    </>
  );

  return href ? (
    <MotionLink to={href} {...motionProps}>
      {content}
    </MotionLink>
  ) : (
    <motion.div {...motionProps}>{content}</motion.div>
  );
};

export default StatCard;
