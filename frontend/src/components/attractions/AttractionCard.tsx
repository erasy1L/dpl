import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Attraction } from "../../types/attraction.types";
import { Badge, Rating } from "../ui";
import { cn } from "../../utils/cn";
import { getLocalizedText } from "../../utils/localization";

interface AttractionCardProps {
  attraction: Attraction;
  className?: string;
}

const AttractionCard = ({ attraction, className }: AttractionCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/attractions/${attraction.id}`);
  };

  // Use original image or placeholder SVG
  const imageUrl =
    attraction.images?.[0]?.original ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23d1d5db'/%3E%3Cg transform='translate(150 100)'%3E%3Crect x='10' y='10' width='80' height='80' fill='none' stroke='%23ffffff' stroke-width='3' rx='2'/%3E%3Ccircle cx='30' cy='35' r='8' fill='%23ffffff'/%3E%3Cpath d='M15 70 L35 50 L50 65 L70 45 L85 60 L85 85 L15 85 Z' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E";

  const attractionName = getLocalizedText(attraction.name);
  const attractionCity = getLocalizedText(attraction.city);

  return (
    <div
      className={cn(
        "group bg-white rounded-lg shadow-card overflow-hidden cursor-pointer",
        "transition-all duration-300",
        "hover:-translate-y-2 hover:shadow-xl",
        className,
      )}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
        <img
          src={imageUrl}
          alt={attractionName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay with View Details button (shown on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <button className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {attractionName}
        </h3>

        {/* City */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{attractionCity}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <Rating value={attraction.average_rating || 0} readonly showValue />
          {attraction.total_ratings && (
            <span className="text-xs text-gray-500">
              ({attraction.total_ratings})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttractionCard;
