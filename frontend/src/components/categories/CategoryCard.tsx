import { Category } from "../../types/attraction.types";
import { cn } from "../../utils/cn";

interface CategoryCardProps {
  category: Category;
  attractionCount?: number;
  onClick?: () => void;
  className?: string;
}

const CategoryCard = ({
  category,
  attractionCount = 0,
  onClick,
  className,
}: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-card",
        "transition-all duration-300",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
        className
      )}
    >
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center text-4xl mb-3">
        {getCategoryIcon(category.icon)}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>

      {/* Count */}
      <p className="text-sm text-gray-600">
        {attractionCount} {attractionCount === 1 ? "place" : "places"}
      </p>
    </button>
  );
};

// Helper function to get category icon
const getCategoryIcon = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    museum: "🏛️",
    park: "🌳",
    monument: "🗿",
    nature: "🏞️",
    cultural: "🎭",
    entertainment: "🎪",
    restaurant: "🍽️",
    shopping: "🛍️",
    religious: "⛪",
    historical: "🏰",
    beach: "🏖️",
    mountain: "⛰️",
    default: "📍",
  };

  return iconMap[iconName.toLowerCase()] || iconMap.default;
};

export default CategoryCard;