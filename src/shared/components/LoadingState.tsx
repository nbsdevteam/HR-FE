import type { ComponentType } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

type LoadingStateVariant = "default" | "compact" | "stacked";

type LoadingStateProps = {
  message: string;
  variant?: LoadingStateVariant;
  icon?: ComponentType<{ className?: string }>;
};

const LoadingState = ({ message, variant = "default", icon: Icon = Loader2 }: LoadingStateProps) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
        <Icon className="w-6 h-6 animate-spin text-primary" />
        <span style={{ fontSize: 14 }}>{message}</span>
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-[300px] text-muted-foreground"
      >
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Icon className="w-8 h-8 mx-auto" />
          </div>
          {message}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <Icon className="w-8 h-8 text-primary animate-spin" />
      <span className="text-muted-foreground ms-3">{message}</span>
    </div>
  );
};

export default LoadingState;
