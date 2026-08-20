import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import {
  categoryCardBgColors,
  categoryCardIconColors,
  categoryCardIcons,
} from "../constants/training";

interface ITrainingCategoryStatCardProps {
  category: string;
  index: number;
  count: number;
}

const TrainingCategoryStatCard = ({
  category,
  index,
  count,
}: ITrainingCategoryStatCardProps) => {
  const CatIcon = categoryCardIcons[index % categoryCardIcons.length];
  return (
    <div
      className={`p-4 rounded-xl ${categoryCardBgColors[index % categoryCardBgColors.length]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <CatIcon
          className={`w-5 h-5 ${categoryCardIconColors[index % categoryCardIconColors.length]}`}
        />
        <h4 className="text-foreground">{category}</h4>
      </div>
      <span className="text-gradient-gold" style={{ fontSize: 36 }}>
        {count}
      </span>
      <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
        {arabicSource("training.programs")} {category}
      </p>
    </div>
  );
};

export default memo(TrainingCategoryStatCard);
