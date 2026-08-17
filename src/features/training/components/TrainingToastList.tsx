import { AnimatePresence } from "motion/react";
import type { Toast } from "../types";
import TrainingToastItem from "./TrainingToastItem";

type TrainingToastListProps = {
  toasts: Toast[];
};

const TrainingToastList = ({ toasts }: TrainingToastListProps) => (
  <AnimatePresence>
    {toasts.map((toast) => (
      <TrainingToastItem key={toast.id} toast={toast} />
    ))}
  </AnimatePresence>
);

export default TrainingToastList;
