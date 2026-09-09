import type { ComponentType, ReactNode } from "react";
import { motion, type TargetAndTransition } from "motion/react";
import { useDirection } from "./ui/useDirection";

type ToastShape = "pill" | "banner" | "card";
type ToastPosition = "bottom-center" | "bottom-start" | "bottom-end" | "top-start" | "top-end";

const SHAPE_CLASSES: Record<ToastShape, string> = {
  pill: "border rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2.5 max-w-sm",
  banner: "border rounded-lg px-4 py-3 shadow-lg flex items-center gap-2.5 max-w-sm",
  card: "border rounded-lg p-4 shadow-lg max-w-sm",
};

const POSITION_CLASSES: Record<Exclude<ToastPosition, "bottom-center">, string> = {
  "bottom-start": "fixed bottom-6 start-6 z-50",
  "bottom-end": "fixed bottom-6 end-6 z-50",
  "top-start": "fixed top-6 start-6 z-50",
  "top-end": "fixed top-6 end-6 z-50",
};

const SIDE_SLIDE_DISTANCE = 24;

// Positions ending in "-start"/"-end" describe a logical (RTL-aware) edge,
// but the slide-in transform is a physical translateX — so the offset's
// sign has to flip with the resolved direction to still enter from off-screen.
const getSideSlideOffset = (position: ToastPosition, isRtl: boolean): number | null => {
  if (position.endsWith("-start")) return isRtl ? SIDE_SLIDE_DISTANCE : -SIDE_SLIDE_DISTANCE;
  if (position.endsWith("-end")) return isRtl ? -SIDE_SLIDE_DISTANCE : SIDE_SLIDE_DISTANCE;
  return null;
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
  iconClassName = "w-3.5 h-3.5",
  textClassName = "text-foreground",
  textSize,
  initial,
  animate,
  exit,
}: ToastProps) => {
  const { isRtl } = useDirection();

  const sideOffset = position === "bottom-center" ? null : getSideSlideOffset(position, isRtl);
  const defaultInitial: TargetAndTransition =
    sideOffset === null ? { opacity: 0, y: 20 } : { opacity: 0, x: sideOffset };
  const defaultAnimate: TargetAndTransition = sideOffset === null ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 };
  const defaultExit: TargetAndTransition =
    sideOffset === null ? { opacity: 0, y: 20 } : { opacity: 0, x: sideOffset };

  const toastBody = (
    <motion.div
      initial={initial ?? defaultInitial}
      animate={animate ?? defaultAnimate}
      exit={exit ?? defaultExit}
      className={`${position === "bottom-center" ? "pointer-events-auto" : POSITION_CLASSES[position]} ${SHAPE_CLASSES[shape]} ${toneClassName}`}
    >
      {Icon && (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${iconBoxClassName || ""}`}>
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
        {toastBody}
      </div>
    );
  }

  return toastBody;
};

export default Toast;
