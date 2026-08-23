import { memo } from "react";
import { renderStars } from "../utils/evaluationHelpers";

type RatingScaleCardProps = {
  value: number;
  label: string;
  labelEn: string;
  bgColor: string;
};

const RatingScaleCard = ({ value, label, labelEn, bgColor }: RatingScaleCardProps) => (
  <div className={`p-3 rounded-lg border ${bgColor} text-center`}>
    <div className="flex justify-center mb-2">{renderStars(value)}</div>
    <p className="text-foreground" style={{ fontSize: 13 }}>{label}</p>
    <p className="text-muted-foreground" style={{ fontSize: 11 }}>{labelEn}</p>
  </div>
);

export default memo(RatingScaleCard);
