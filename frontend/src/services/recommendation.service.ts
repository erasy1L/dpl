import api from "./api";
import { Attraction } from "../types/attraction.types";

export type RecommendationsResponse = {
  recommendations: Attraction[];
  reason: string;
};

class RecommendationService {
  /** GET /api/v1/recommendations — combined feed for the current user */
  async getRecommendations(
    limit = 24,
    city?: string,
  ): Promise<RecommendationsResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (city) {
      params.set("city", city);
    }
    const response = await api.get<{
      recommendations: Attraction[];
      reason: string;
    }>(`/recommendations?${params.toString()}`);
    return {
      recommendations: response.data.recommendations ?? [],
      reason: response.data.reason ?? "",
    };
  }

  // Legacy / detail use — still available on the API
  async getSimilar(attractionId: number, limit = 6): Promise<Attraction[]> {
    try {
      const response = await api.get<{ attractions: Attraction[] }>(
        `/recommendations/similar/${attractionId}?limit=${limit}`,
      );
      return response.data.attractions;
    } catch (error) {
      const attraction = await api.get(`/attractions/${attractionId}`);
      const categoryId = attraction.data.attraction.categoryId;
      const fallback = await api.get(
        `/attractions?category_id=${categoryId}&limit=${limit}&offset=0`,
      );
      return fallback.data.attractions.filter(
        (a: Attraction) => a.id !== attractionId,
      );
    }
  }
}

export default new RecommendationService();
