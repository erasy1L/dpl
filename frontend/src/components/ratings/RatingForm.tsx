import { useState, FormEvent } from "react";
import { Button } from "../ui";
import RatingInput from "./RatingInput";
import { CreateRatingData } from "../../types/rating.types";
import toast from "react-hot-toast";
import ratingService from "../../services/rating.service";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

interface RatingFormProps {
  attractionId: number;
  onSuccess?: () => void;
}

const RatingForm = ({ attractionId, onSuccess }: RatingFormProps) => {
  useLocale();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error(m.toast_rating_required());
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
      toast.success(m.toast_review_submitted());

      // Reset form
      setRating(0);
      setReview("");

      // Callback to refresh ratings
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || m.toast_review_submit_failed());
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
        {m.write_review()}
      </h3>

      {/* Rating Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {m.your_rating()} <span className="text-red-500">*</span>
        </label>
        <RatingInput value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {m.your_review_optional()}
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder={m.share_experience_placeholder()}
          disabled={submitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          {m.characters_count({ count: review.length })}
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
        {m.submit_review()}
      </Button>
    </form>
  );
};

export default RatingForm;
