import { Rating } from "../../types/rating.types";
import { Button, EmptyState, Skeleton } from "../ui";
import ReviewCard from "./ReviewCard";
import { MessageSquare } from "lucide-react";

interface ReviewListProps {
  ratings: Rating[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const ReviewList = ({
  ratings,
  loading = false,
  hasMore = false,
  onLoadMore,
}: ReviewListProps) => {
  if (loading && ratings.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="30%" />
              </div>
            </div>
            <Skeleton variant="text" count={3} />
          </div>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-16 h-16" />}
        title="No reviews yet"
        description="Be the first to share your experience!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <ReviewCard key={rating.id} rating={rating} />
      ))}

      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More Reviews"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;