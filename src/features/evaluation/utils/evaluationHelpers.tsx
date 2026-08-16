import { Star } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ratingScale, type EvalCycleType } from "../types";

export const getPeriodOptions = (cycle: EvalCycleType, year: number): string[] => {
  switch (cycle) {
    case arabicSource("common.quarterly"):
      return [`${arabicSource("evaluation.first_quarter")} ${year}`, `${arabicSource("evaluation.second_quarter")} ${year}`, `${arabicSource("evaluation.third_quarter")} ${year}`, `${arabicSource("evaluation.fourth_quarter")} ${year}`];
    case arabicSource("common.semi_annually"):
      return [`${arabicSource("evaluation.first_half")} ${year}`, `${arabicSource("evaluation.the_second_half")} ${year}`];
    case arabicSource("common.annual"):
      return [`${arabicSource("evaluation.year")} ${year}`];
    case arabicSource("common.probationary_period"):
      return [`${arabicSource("common.probation_period")} ${year}`];
    default:
      return [];
  }
};

export const getRatingInfo = (rating: number) => {
  return ratingScale.find(r => r.value === rating) || ratingScale[2];
};

export const renderStars = (rating: number, size = 16) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`${i < rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
      style={{ width: size, height: size }}
    />
  ));
};
