import { Star } from "lucide-react";

type StarScoreButtonsProps = {
  score: number;
  onChange: (value: number) => void;
};

const StarScoreButtons = ({ score, onChange }: StarScoreButtonsProps) => {
  const handleStarClick = (value: number) => (): void => {
    onChange(value);
  };

  return (
    <>
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} onClick={handleStarClick(v)} className="cursor-pointer">
          <Star className={`w-5 h-5 transition-colors ${v <= score ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary/50"}`} />
        </button>
      ))}
    </>
  );
};

export default StarScoreButtons;
