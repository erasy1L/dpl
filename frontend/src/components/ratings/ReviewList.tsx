import { Rating } from "../../types/rating.types";
import { Button, EmptyState, Skeleton } from "../ui";
import ReviewCard from "./ReviewCard";
import { MessageSquare } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

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
  useLocale();

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
        title={m.no_reviews_title()}
        description={m.no_reviews_desc()}
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
            {loading ? m.loading() : m.load_more_reviews()}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
