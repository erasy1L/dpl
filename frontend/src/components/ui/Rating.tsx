import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

export interface RatingProps {
  value: number;
  showValue?: boolean;
  readonly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const Rating = ({
  value,
  showValue = false,
  readonly = false,
  onChange,
  className,
}: RatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onMouseLeave={() => !readonly && setHoverValue(null)}
              disabled={readonly}
              className={cn(
                "transition-all duration-200",
                !readonly && "cursor-pointer hover:scale-110",
                readonly && "cursor-default"
              )}
            >
              <Star
                className={cn(
                  "w-5 h-5",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Rating;