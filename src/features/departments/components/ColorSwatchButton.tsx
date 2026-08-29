type ColorSwatchButtonProps = {
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
};

const ColorSwatchButton = ({ color, selected, onSelect }: ColorSwatchButtonProps) => {
  const handleClick = (): void => {
    onSelect(color);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-5 h-5 rounded-full transition-all ${selected ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
      style={{ background: color }}
    />
  );
};

export default ColorSwatchButton;
