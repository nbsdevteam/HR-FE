import type { ComponentType, ReactNode } from "react";
import { motion, type TargetAndTransition } from "motion/react";

type ToastShape = "pill" | "banner" | "card";
type ToastPosition = "bottom-center" | "bottom-start" | "bottom-end" | "top-full";

const SHAPE_CLASSES: Record<ToastShape, string> = {
  pill: "border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5",
  banner: "px-4 py-3 rounded-lg",
  card: "border rounded-lg p-4 shadow-lg max-w-xs",
};

const POSITION_CLASSES: Record<Exclude<ToastPosition, "bottom-center">, string> = {
  "bottom-start": "fixed bottom-6 start-6 z-50",
  "bottom-end": "fixed bottom-6 end-6 z-50",
  "top-full": "fixed top-4 start-4 end-4 z-50",
};

type ToastProps = {
  message: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  shape?: ToastShape;
  position?: ToastPosition;
  toneClassName?: string;
  iconBoxClassName?: string;
  iconClassName?: string;
  textClassName?: string;
  textSize?: number;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
};

const Toast = ({
  message,
  icon: Icon,
  shape = "pill",
  position = "bottom-start",
  toneClassName = "bg-card border-border",
  iconBoxClassName,
  iconClassName = "w-3 h-3",
  textClassName = "text-foreground",
  textSize,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  exit = { opacity: 0, y: 20 },
}: ToastProps) => {
  const pill = (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      className={`${position === "bottom-center" ? "pointer-events-auto" : POSITION_CLASSES[position]} ${SHAPE_CLASSES[shape]} ${toneClassName}`}
    >
      {Icon && (
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${iconBoxClassName || ""}`}>
          <Icon className={iconClassName} />
        </div>
      )}
      <span className={textClassName} style={textSize ? { fontSize: textSize } : undefined}>
        {message}
      </span>
    </motion.div>
  );

  if (position === "bottom-center") {
    return (
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        {pill}
      </div>
    );
  }

  return pill;
};

export default Toast;
