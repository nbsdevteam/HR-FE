import type { GeoCity } from "@/shared/api/geo";

type CityDidYouMeanOptionProps = {
  city: GeoCity;
  label: string;
  onSelect: (city: GeoCity) => void;
};

const CityDidYouMeanOption = ({ city, label, onSelect }: CityDidYouMeanOptionProps) => {
  const handleClick = (): void => onSelect(city);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-start px-2.5 py-1.5 rounded-md bg-muted/20 hover:bg-muted/40 text-foreground transition-colors cursor-pointer"
      style={{ fontSize: 12 }}
    >
      {label}
    </button>
  );
};

export default CityDidYouMeanOption;
