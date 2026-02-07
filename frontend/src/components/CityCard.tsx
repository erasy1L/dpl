import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "../utils/cn";

interface CityCardProps {
  name: string;
  imageUrl: string;
  attractionCount: number;
  className?: string;
}

const CityCard = ({
  name,
  imageUrl,
  attractionCount,
  className,
}: CityCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/attractions?city=${encodeURIComponent(name)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative h-64 md:h-80 w-full overflow-hidden rounded-xl shadow-lg",
        "transition-all duration-300 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500",
        className
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="flex items-center gap-2 mb-2 text-white/90">
          <MapPin className="w-5 h-5" />
          <span className="text-sm font-medium">Kazakhstan</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {name}
        </h3>
        <p className="text-white/90 text-sm">
          {attractionCount} {attractionCount === 1 ? "attraction" : "attractions"}
        </p>
      </div>
    </button>
  );
};

export default CityCard;