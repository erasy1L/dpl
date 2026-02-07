import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RatingInput = ({
  value,
  onChange,
  size = "md",
  className,
}: RatingInputProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingInput;