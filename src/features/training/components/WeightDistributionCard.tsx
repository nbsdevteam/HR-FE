import { useMemo } from "react";
import { motion } from "motion/react";
import DonutChart from "@/shared/components/donut-chart";
import { arabicSource } from "@/i18n/source";
import type { DbTrainingProgram } from "@/shared/hooks";
import { countBy } from "@/shared/utils/collections";
import { cardCls } from "../styles";
import TrainingCategoryStatCard from "./TrainingCategoryStatCard";

type TWeightDistributionCardProps = {
  programs: DbTrainingProgram[];
  trainingCategories: string[];
  categoryDistribution: { name: string; value: number; color: string }[];
};

const WeightDistributionCard = ({
  programs,
  trainingCategories,
  categoryDistribution,
}: TWeightDistributionCardProps) => {
  const categoryCounts = useMemo(
    () => countBy(programs, (p) => p.category),
    [programs],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardCls}
    >
      <h3 className="text-foreground mb-4">
        {arabicSource("training.distribution_of_training_weights")}
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-1 flex items-center justify-center">
          <DonutChart
            data={categoryDistribution}
            size={180}
            innerRadius={50}
            outerRadius={80}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {trainingCategories.slice(0, 4).map((cat, idx) => (
            <TrainingCategoryStatCard
              key={cat}
              category={cat}
              index={idx}
              count={categoryCounts.get(cat) || 0}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeightDistributionCard;
