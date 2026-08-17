import { Star } from "lucide-react";

const StarRating = ({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          disabled={!onChange}
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= value ? "text-primary fill-primary" : "text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
