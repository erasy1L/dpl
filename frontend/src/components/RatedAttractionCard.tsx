import { useNavigate } from "react-router-dom";
import { MapPin, Edit2, Trash2 } from "lucide-react";
import { Rating } from "./ui";
import { Rating as RatingType } from "../types/rating.types";
import { formatRelativeTime } from "../utils/formatters";
import attractionService from "../services/attraction.service";
import { useEffect, useState } from "react";
import { Attraction } from "../types/attraction.types";

interface RatedAttractionCardProps {
  rating: RatingType;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RatedAttractionCard = ({
  rating,
  onEdit,
  onDelete,
}: RatedAttractionCardProps) => {
  const navigate = useNavigate();

  const [attraction, setAttraction] = useState<Attraction>();

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const data = await attractionService.getById(rating.attraction_id);
        setAttraction(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAttraction();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Image */}
        <div
          className="w-24 h-24 shrink-0 rounded-lg bg-gray-200 bg-cover bg-center cursor-pointer"
          style={{
            backgroundImage: `url(https://picsum.photos/seed/${rating.attraction_id}/200/200)`,
          }}
          onClick={() => navigate(`/attractions/${rating.attraction_id}`)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary-600 line-clamp-1"
            onClick={() => navigate(`/attractions/${rating.attraction_id}`)}
          >
            {attraction?.name_en}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatRelativeTime(rating.created_at)}
            </span>
          </div>

          <Rating value={rating.rating} readonly className="mb-2" />

          {rating.review && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {rating.review}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit rating"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete rating"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatedAttractionCard;
