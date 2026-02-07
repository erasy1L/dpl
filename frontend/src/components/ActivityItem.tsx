import { useNavigate } from "react-router-dom";
import { Eye, Star, Heart } from "lucide-react";
import { UserActivity } from "../types/user.types";
import { formatRelativeTime } from "../utils/formatters";
import { cn } from "../utils/cn";

interface ActivityItemProps {
  activity: UserActivity;
}

const ActivityItem = ({ activity }: ActivityItemProps) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (activity.type) {
      case "view":
        return <Eye className="w-5 h-5 text-blue-500" />;
      case "rating":
        return <Star className="w-5 h-5 text-amber-500" />;
      case "favorite":
        return <Heart className="w-5 h-5 text-red-500 fill-current" />;
    }
  };

  const getDescription = () => {
    switch (activity.type) {
      case "view":
        return "Viewed";
      case "rating":
        return `Rated ${activity.details?.rating || 0} stars`;
      case "favorite":
        return "Added to favorites";
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      {/* Icon */}
      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        activity.type === "view" && "bg-blue-100",
        activity.type === "rating" && "bg-amber-100",
        activity.type === "favorite" && "bg-red-100"
      )}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-700">
          {getDescription()}{" "}
          <button
            onClick={() => navigate(`/attractions/${activity.attractionId}`)}
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            {activity.attractionName}
          </button>
        </p>

        {activity.details?.review && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            "{activity.details.review}"
          </p>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;