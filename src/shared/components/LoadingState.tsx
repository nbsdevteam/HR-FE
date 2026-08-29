import type { ComponentType } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

type LoadingStateVariant = "default" | "compact" | "stacked";

type LoadingStateProps = {
  message?: string;
  variant?: LoadingStateVariant;
  icon?: ComponentType<{ className?: string }>;
  /** Full override for the outer wrapper's className, when a call site's spacing doesn't match the variant default. */
  wrapperClassName?: string;
  /** Full override for the spinner icon's className, when a call site's icon size doesn't match the variant default. */
  iconClassName?: string;
};

const LoadingState = ({ message, variant = "default", icon: Icon = Loader2, wrapperClassName, iconClassName }: LoadingStateProps) => {
  if (variant === "compact") {
    return (
      <div className={wrapperClassName ?? "flex items-center justify-center gap-3 py-20 text-muted-foreground"}>
        <Icon className={iconClassName ?? "w-6 h-6 animate-spin text-primary"} />
        {message && <span style={{ fontSize: 14 }}>{message}</span>}
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={wrapperClassName ?? "flex items-center justify-center h-[300px] text-muted-foreground"}
      >
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Icon className={iconClassName ?? "w-8 h-8 mx-auto"} />
          </div>
          {message}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={wrapperClassName ?? "flex items-center justify-center h-64"}>
      <Icon className={iconClassName ?? "w-8 h-8 text-primary animate-spin"} />
      {message && <span className="text-muted-foreground ms-3">{message}</span>}
    </div>
  );
};

export default LoadingState;
