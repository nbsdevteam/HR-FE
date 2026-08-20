import { categoryLabels } from "../constants/settings";

type CategoryGroupHeaderProps = {
  category: string;
};

const CategoryGroupHeader = ({ category }: CategoryGroupHeaderProps) => (
  <div className="flex items-center gap-3 mb-3 pb-2 border-s-4 border-primary ps-3">
    <h4 className="text-foreground font-medium">{categoryLabels[category] || category}</h4>
  </div>
);

export default CategoryGroupHeader;
