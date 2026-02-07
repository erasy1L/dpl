import { useState, FormEvent } from "react";
import { Button } from "../ui";
import RatingInput from "./RatingInput";
import { CreateRatingData } from "../../types/rating.types";
import toast from "react-hot-toast";
import ratingService from "../../services/rating.service";

interface RatingFormProps {
  attractionId: number;
  onSuccess?: () => void;
}

const RatingForm = ({ attractionId, onSuccess }: RatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const data: CreateRatingData = {
        attraction_id: attractionId,
        rating,
        review: review.trim() || undefined,
      };
      console.log("rating data: ", data);
      await ratingService.create(data);
      toast.success("Review submitted successfully!");

      // Reset form
      setRating(0);
      setReview("");

      // Callback to refresh ratings
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message || "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 p-6 rounded-lg border border-gray-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Write a Review
      </h3>

      {/* Rating Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <RatingInput value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Review (optional)
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Share your experience..."
          disabled={submitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          {review.length} / 500 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={submitting}
        disabled={rating === 0}
      >
        Submit Review
      </Button>
    </form>
  );
};

export default RatingForm;
