import { useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Rating } from "../../types/rating.types";
import { Avatar } from "../ui";
import { formatRelativeTime } from "../../utils/formatters";
import { cn } from "../../utils/cn";

interface ReviewCardProps {
  rating: Rating;
  className?: string;
}

const ReviewCard = ({ rating, className }: ReviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpful, setHelpful] = useState(false);

  const shouldTruncate = rating.review && rating.review.length > 200;
  const displayText =
    shouldTruncate && !isExpanded
      ? rating.review!.slice(0, 200) + "..."
      : rating.review;

  return (
    <div className={cn("bg-white p-6 rounded-lg border border-gray-200", className)}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar
          fallback={rating.user.name.charAt(0)}
          size="md"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">{rating.user.name}</h4>
            <span className="text-sm text-gray-500">
              {formatRelativeTime(rating.createdAt)}
            </span>
          </div>
          {/* Stars */}
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "w-4 h-4",
                  index < rating.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Review Text */}
      {rating.review && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{displayText}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Helpful Button */}
      <button
        onClick={() => setHelpful(!helpful)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm",
          helpful
            ? "bg-primary-50 text-primary-600"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        <ThumbsUp className={cn("w-4 h-4", helpful && "fill-current")} />
        <span>Helpful</span>
      </button>
    </div>
  );
};

export default ReviewCard;